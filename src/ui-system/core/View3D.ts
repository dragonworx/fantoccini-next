import * as THREE from 'three';
import { View, type InputEvent } from './View';
import { Scene } from './Scene';

/**
 * Specialized view for 3D content with perspective camera and 3D navigation controls.
 * 
 * @class View3D
 * @extends View
 * @memberof ui-system.core
 */
export class View3D extends View {
	/**
	 * Perspective camera for 3D rendering.
	 * @public
	 * @readonly
	 */
	public readonly camera: THREE.PerspectiveCamera;

	/**
	 * Orbit center point.
	 * @private
	 */
	private orbitCenter = new THREE.Vector3(0, 0, 0);

	/**
	 * Camera spherical coordinates.
	 * @private
	 */
	private spherical = new THREE.Spherical(50, Math.PI / 4, Math.PI / 4);

	/**
	 * Mouse state for interaction.
	 * @private
	 */
	private mouseState = {
		position: new THREE.Vector2(),
		lastPosition: new THREE.Vector2(),
		isLeftDown: false,
		isRightDown: false,
		isMiddleDown: false
	};

	/**
	 * Raycaster for sprite interaction.
	 * @private
	 */
	private raycaster = new THREE.Raycaster();

	/**
	 * Currently hovered sprite.
	 * @private
	 */
	private hoveredSprite: any = null;

	/**
	 * Currently pressed sprite.
	 * @private
	 */
	private pressedSprite: any = null;

	/**
	 * Orbit speed.
	 * @private
	 */
	private orbitSpeed = 0.01;

	/**
	 * Dolly speed.
	 * @private
	 */
	private dollySpeed = 0.1;

	/**
	 * Pan speed.
	 * @private
	 */
	private panSpeed = 0.01;

	/**
	 * Creates a new View3D instance.
	 * @public
	 * @param {Scene} scene - The scene to render
	 * @param {THREE.PerspectiveCamera} [camera] - Optional camera
	 * @param {HTMLCanvasElement} [canvas] - Optional canvas element
	 */
	public constructor(scene: Scene, camera?: THREE.PerspectiveCamera, canvas?: HTMLCanvasElement) {
		const defaultCamera = camera || new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		
		super(scene, defaultCamera, canvas);
		this.camera = defaultCamera;
		
		// Position camera
		this.updateCameraPosition();
		
		// Setup event listeners
		this.setupEventListeners();
	}

	/**
	 * Orbits the camera.
	 * @public
	 * @param {number} deltaX - X rotation delta
	 * @param {number} deltaY - Y rotation delta
	 * @returns {void}
	 */
	public orbit(deltaX: number, deltaY: number): void {
		this.spherical.theta -= deltaX * this.orbitSpeed;
		this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi - deltaY * this.orbitSpeed));
		this.updateCameraPosition();
	}

	/**
	 * Dollies the camera (zoom).
	 * @public
	 * @param {number} delta - Dolly amount
	 * @returns {void}
	 */
	public dolly(delta: number): void {
		this.spherical.radius = Math.max(1, this.spherical.radius * (1 + delta * this.dollySpeed));
		this.updateCameraPosition();
	}

	/**
	 * Pans the camera.
	 * @public
	 * @param {number} deltaX - X pan delta
	 * @param {number} deltaY - Y pan delta
	 * @returns {void}
	 */
	public pan(deltaX: number, deltaY: number): void {
		const distance = this.camera.position.distanceTo(this.orbitCenter);
		const panX = deltaX * this.panSpeed * distance;
		const panY = deltaY * this.panSpeed * distance;
		
		const right = new THREE.Vector3();
		const up = new THREE.Vector3();
		
		this.camera.getWorldDirection(new THREE.Vector3());
		right.setFromMatrixColumn(this.camera.matrix, 0);
		up.setFromMatrixColumn(this.camera.matrix, 1);
		
		this.orbitCenter.add(right.multiplyScalar(-panX));
		this.orbitCenter.add(up.multiplyScalar(panY));
		
		this.updateCameraPosition();
	}

	/**
	 * Points camera at target.
	 * @public
	 * @param {THREE.Vector3} target - Target position
	 * @returns {void}
	 */
	public lookAt(target: THREE.Vector3): void {
		this.orbitCenter.copy(target);
		this.updateCameraPosition();
	}

	/**
	 * Fits camera to bounding box.
	 * @public
	 * @param {THREE.Box3} boundingBox - Bounding box to fit
	 * @param {number} [padding=1.2] - Padding factor
	 * @returns {void}
	 */
	public fitToContent(boundingBox: THREE.Box3, padding: number = 1.2): void {
		const center = boundingBox.getCenter(new THREE.Vector3());
		const size = boundingBox.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z);
		
		this.orbitCenter.copy(center);
		
		// Calculate distance needed to fit object
		const fov = this.camera.fov * (Math.PI / 180);
		const distance = (maxDim * padding) / (2 * Math.tan(fov / 2));
		
		this.spherical.radius = distance;
		this.updateCameraPosition();
	}

	/**
	 * Sets field of view.
	 * @public
	 * @param {number} fov - Field of view in degrees
	 * @returns {void}
	 */
	public setFieldOfView(fov: number): void {
		this.camera.fov = fov;
		this.camera.updateProjectionMatrix();
	}

	/**
	 * Sets clipping planes.
	 * @public
	 * @param {number} near - Near plane
	 * @param {number} far - Far plane
	 * @returns {void}
	 */
	public setClippingPlanes(near: number, far: number): void {
		this.camera.near = near;
		this.camera.far = far;
		this.camera.updateProjectionMatrix();
	}

	/**
	 * Renders the view.
	 * @public
	 * @override
	 * @returns {void}
	 */
	public render(): void {
		this.baseRender();
	}

	/**
	 * Resizes the view.
	 * @public
	 * @override
	 * @param {number} width - New width
	 * @param {number} height - New height
	 * @returns {void}
	 */
	public resize(width: number, height: number): void {
		this.viewport.width = width;
		this.viewport.height = height;
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
		this.events.emitEvent('resize', { width, height });
	}

	/**
	 * Handles input events.
	 * @public
	 * @override
	 * @param {InputEvent} event - The input event
	 * @returns {boolean} True if event was consumed
	 */
	public handleInput(event: InputEvent): boolean {
		if (event instanceof MouseEvent) {
			return this.handleMouseEvent(event);
		} else if (event instanceof WheelEvent) {
			return this.handleWheelEvent(event);
		}
		return false;
	}

	/**
	 * Updates camera position from spherical coordinates.
	 * @private
	 * @returns {void}
	 */
	private updateCameraPosition(): void {
		const position = new THREE.Vector3();
		position.setFromSpherical(this.spherical);
		position.add(this.orbitCenter);
		
		this.camera.position.copy(position);
		this.camera.lookAt(this.orbitCenter);
		
		this.events.emitEvent('camera:change', { camera: this.camera });
	}

	/**
	 * Sets up event listeners.
	 * @private
	 * @returns {void}
	 */
	private setupEventListeners(): void {
		this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
		this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
		this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
		this.canvas.addEventListener('wheel', this.onWheel.bind(this));
		this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
	}

	/**
	 * Handles mouse down event.
	 * @private
	 * @param {MouseEvent} event - Mouse event
	 * @returns {void}
	 */
	private onMouseDown(event: MouseEvent): void {
		this.mouseState.lastPosition.set(event.clientX, event.clientY);
		
		// Check for sprite interaction first
		const sprite = this.getSpriteAtPosition(event.clientX, event.clientY);
		
		if (sprite && event.button === 0) {
			this.pressedSprite = sprite;
			// Emit mousedown event
			sprite.events.emitEvent('mousedown', { 
				sprite, 
				event 
			});
			event.preventDefault();
		}
		
		switch (event.button) {
			case 0: // Left
				this.mouseState.isLeftDown = true;
				break;
			case 1: // Middle
				this.mouseState.isMiddleDown = true;
				break;
			case 2: // Right
				this.mouseState.isRightDown = true;
				break;
		}
	}

	/**
	 * Handles mouse move event.
	 * @private
	 * @param {MouseEvent} event - Mouse event
	 * @returns {void}
	 */
	private onMouseMove(event: MouseEvent): void {
		this.mouseState.position.set(event.clientX, event.clientY);
		
		const deltaX = event.clientX - this.mouseState.lastPosition.x;
		const deltaY = event.clientY - this.mouseState.lastPosition.y;
		
		if (this.mouseState.isLeftDown && !this.pressedSprite) {
			this.orbit(deltaX, deltaY);
		} else if (this.mouseState.isMiddleDown || (this.mouseState.isRightDown && event.shiftKey)) {
			this.pan(deltaX, deltaY);
		} else if (!this.mouseState.isLeftDown) {
			// Check for hover when not dragging
			const sprite = this.getSpriteAtPosition(event.clientX, event.clientY);
			
			if (sprite !== this.hoveredSprite) {
				// Exit previous hover
				if (this.hoveredSprite) {
					this.hoveredSprite.events.emitEvent('hover:exit', { 
						sprite: this.hoveredSprite, 
						event 
					});
				}
				
				// Enter new hover
				if (sprite) {
					sprite.events.emitEvent('hover:enter', { 
						sprite, 
						event, 
						intersection: {} as THREE.Intersection 
					});
				}
				
				this.hoveredSprite = sprite;
			}
		}
		
		this.mouseState.lastPosition.set(event.clientX, event.clientY);
	}

	/**
	 * Handles mouse up event.
	 * @private
	 * @param {MouseEvent} event - Mouse event
	 * @returns {void}
	 */
	private onMouseUp(event: MouseEvent): void {
		if (this.pressedSprite && event.button === 0) {
			// Emit mouseup event
			this.pressedSprite.events.emitEvent('mouseup', { 
				sprite: this.pressedSprite, 
				event 
			});
			
			// Check if mouse is still over the pressed sprite for click
			const sprite = this.getSpriteAtPosition(event.clientX, event.clientY);
			if (sprite === this.pressedSprite) {
				sprite.events.emitEvent('click', { 
					sprite, 
					event, 
					intersection: {} as THREE.Intersection 
				});
			}
			
			this.pressedSprite = null;
		}
		
		switch (event.button) {
			case 0:
				this.mouseState.isLeftDown = false;
				break;
			case 1:
				this.mouseState.isMiddleDown = false;
				break;
			case 2:
				this.mouseState.isRightDown = false;
				break;
		}
	}

	/**
	 * Handles wheel event.
	 * @private
	 * @param {WheelEvent} event - Wheel event
	 * @returns {void}
	 */
	private onWheel(event: WheelEvent): void {
		event.preventDefault();
		const delta = event.deltaY > 0 ? 1 : -1;
		this.dolly(delta);
	}

	/**
	 * Gets sprite at screen position.
	 * @private
	 * @param {number} x - Screen X coordinate
	 * @param {number} y - Screen Y coordinate
	 * @returns {any | null} Sprite at position or null
	 */
	private getSpriteAtPosition(x: number, y: number): any | null {
		const rect = this.canvas.getBoundingClientRect();
		const mouse = new THREE.Vector2(
			((x - rect.left) / rect.width) * 2 - 1,
			-((y - rect.top) / rect.height) * 2 + 1
		);
		
		this.raycaster.setFromCamera(mouse, this.camera);
		
		// Collect all sprites
		const sprites: any[] = [];
		this.scene.traverse((obj: any) => {
			if ('markNeedsUpdate' in obj && 'mesh' in obj) {
				sprites.push(obj);
			}
		});
		
		// Test for intersections
		const meshes = sprites.map(s => s.mesh).filter(m => m !== null);
		const intersects = this.raycaster.intersectObjects(meshes, false);
		
		if (intersects.length > 0) {
			// Return the closest intersection
			const mesh = intersects[0].object;
			return sprites.find(s => s.mesh === mesh) || null;
		}
		
		return null;
	}

	/**
	 * Handles mouse events.
	 * @private
	 * @param {MouseEvent} event - Mouse event
	 * @returns {boolean} True if handled
	 */
	private handleMouseEvent(event: MouseEvent): boolean {
		// Forward to input system
		return false;
	}

	/**
	 * Handles wheel events.
	 * @private
	 * @param {WheelEvent} event - Wheel event
	 * @returns {boolean} True if handled
	 */
	private handleWheelEvent(event: WheelEvent): boolean {
		this.onWheel(event);
		return true;
	}
}