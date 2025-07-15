import * as THREE from 'three';
import { View, type InputEvent } from './View';
import { Scene } from './Scene';
import type { Sprite } from '../sprites/Sprite';

/**
 * Specialized view for 2D content with orthographic camera and 2D navigation controls.
 * 
 * @class View2D
 * @extends View
 * @memberof ui-system.core
 */
export class View2D extends View {
	/**
	 * Orthographic camera for 2D rendering.
	 * @public
	 * @readonly
	 */
	public readonly camera: THREE.OrthographicCamera;

	/**
	 * Pan offset.
	 * @private
	 */
	private panOffset = new THREE.Vector2(0, 0);

	/**
	 * Current zoom level.
	 * @private
	 */
	private zoomLevel = 1;

	/**
	 * Zoom limits.
	 * @private
	 */
	private zoomLimits = { min: 0.1, max: 10 };

	/**
	 * Mouse position for interaction.
	 * @private
	 */
	private mousePosition = new THREE.Vector2();

	/**
	 * Last mouse position for dragging.
	 * @private
	 */
	private lastMousePosition = new THREE.Vector2();

	/**
	 * Flag for dragging state.
	 * @private
	 */
	private isDragging = false;

	/**
	 * Raycaster for sprite interaction.
	 * @private
	 */
	private raycaster = new THREE.Raycaster();

	/**
	 * Currently hovered sprite.
	 * @private
	 */
	private hoveredSprite: Sprite | null = null;

	/**
	 * Currently pressed sprite.
	 * @private
	 */
	private pressedSprite: Sprite | null = null;

	/**
	 * Creates a new View2D instance.
	 * @public
	 * @param {Scene} scene - The scene to render
	 * @param {THREE.OrthographicCamera} [camera] - Optional camera
	 * @param {HTMLCanvasElement} [canvas] - Optional canvas element
	 */
	public constructor(scene: Scene, camera?: THREE.OrthographicCamera, canvas?: HTMLCanvasElement) {
		const defaultCamera = camera || new THREE.OrthographicCamera(
			-window.innerWidth / 2,
			window.innerWidth / 2,
			window.innerHeight / 2,
			-window.innerHeight / 2,
			0.1,
			1000
		);
		
		super(scene, defaultCamera, canvas);
		this.camera = defaultCamera;
		
		// Position camera for 2D view
		this.camera.position.z = 100;
		this.camera.lookAt(0, 0, 0);
		
		// Setup event listeners
		this.setupEventListeners();
	}

	/**
	 * Pans the camera.
	 * @public
	 * @param {number} deltaX - X delta
	 * @param {number} deltaY - Y delta
	 * @returns {void}
	 */
	public pan(deltaX: number, deltaY: number): void {
		this.panOffset.x += deltaX / this.zoomLevel;
		this.panOffset.y -= deltaY / this.zoomLevel;
		this.updateCamera();
	}

	/**
	 * Zooms the camera.
	 * @public
	 * @param {number} factor - Zoom factor
	 * @param {number} [centerX] - Zoom center X
	 * @param {number} [centerY] - Zoom center Y
	 * @returns {void}
	 */
	public zoom(factor: number, centerX?: number, centerY?: number): void {
		const newZoom = Math.max(this.zoomLimits.min, Math.min(this.zoomLimits.max, this.zoomLevel * factor));
		
		if (centerX !== undefined && centerY !== undefined) {
			// Zoom to point
			const worldBefore = this.screenToWorld(centerX, centerY);
			this.zoomLevel = newZoom;
			this.updateCamera();
			const worldAfter = this.screenToWorld(centerX, centerY);
			
			this.panOffset.x += worldBefore.x - worldAfter.x;
			this.panOffset.y += worldBefore.y - worldAfter.y;
		} else {
			this.zoomLevel = newZoom;
		}
		
		this.updateCamera();
	}

	/**
	 * Fits content to view.
	 * @public
	 * @param {number} [padding=20] - Padding around content
	 * @returns {void}
	 */
	public fitToContent(padding: number = 20): void {
		const box = new THREE.Box3();
		
		// Calculate bounding box of all objects
		this.scene.traverse((obj) => {
			if (obj instanceof THREE.Mesh) {
				box.expandByObject(obj);
			}
		});
		
		if (box.isEmpty()) return;
		
		const size = box.getSize(new THREE.Vector3());
		const center = box.getCenter(new THREE.Vector3());
		
		// Calculate zoom to fit
		const scaleX = (this.viewport.width - padding * 2) / size.x;
		const scaleY = (this.viewport.height - padding * 2) / size.y;
		this.zoomLevel = Math.min(scaleX, scaleY);
		
		// Center the content
		this.panOffset.set(-center.x, -center.y);
		
		this.updateCamera();
	}

	/**
	 * Sets zoom limits.
	 * @public
	 * @param {number} min - Minimum zoom
	 * @param {number} max - Maximum zoom
	 * @returns {void}
	 */
	public setZoomLimits(min: number, max: number): void {
		this.zoomLimits = { min, max };
		this.zoomLevel = Math.max(min, Math.min(max, this.zoomLevel));
		this.updateCamera();
	}

	/**
	 * Converts screen coordinates to world coordinates.
	 * @public
	 * @param {number} screenX - Screen X
	 * @param {number} screenY - Screen Y
	 * @returns {THREE.Vector2} World coordinates
	 */
	public screenToWorld(screenX: number, screenY: number): THREE.Vector2 {
		const x = (screenX / this.viewport.width) * 2 - 1;
		const y = -(screenY / this.viewport.height) * 2 + 1;
		
		const vec = new THREE.Vector3(x, y, 0);
		vec.unproject(this.camera);
		
		return new THREE.Vector2(vec.x, vec.y);
	}

	/**
	 * Converts world coordinates to screen coordinates.
	 * @public
	 * @param {number} worldX - World X
	 * @param {number} worldY - World Y
	 * @returns {THREE.Vector2} Screen coordinates
	 */
	public worldToScreen(worldX: number, worldY: number): THREE.Vector2 {
		const vec = new THREE.Vector3(worldX, worldY, 0);
		vec.project(this.camera);
		
		const x = (vec.x + 1) * this.viewport.width / 2;
		const y = -(vec.y - 1) * this.viewport.height / 2;
		
		return new THREE.Vector2(x, y);
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
		this.renderer.setSize(width, height);
		this.updateCamera();
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
	 * Updates camera projection.
	 * @private
	 * @returns {void}
	 */
	private updateCamera(): void {
		const halfWidth = this.viewport.width / (2 * this.zoomLevel);
		const halfHeight = this.viewport.height / (2 * this.zoomLevel);
		
		this.camera.left = -halfWidth + this.panOffset.x;
		this.camera.right = halfWidth + this.panOffset.x;
		this.camera.top = halfHeight + this.panOffset.y;
		this.camera.bottom = -halfHeight + this.panOffset.y;
		
		this.camera.updateProjectionMatrix();
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
		this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
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
		// Check for sprite interaction first
		const sprite = this.getSpriteAtPosition(event.clientX, event.clientY);
		
		if (sprite && event.button === 0 && !event.shiftKey) {
			this.pressedSprite = sprite;
			sprite.events.emitEvent('drag:start', { 
				sprite, 
				event, 
				startPosition: new THREE.Vector2(event.clientX, event.clientY) 
			});
			event.preventDefault();
		} else if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
			this.isDragging = true;
			this.lastMousePosition.set(event.clientX, event.clientY);
			event.preventDefault();
		}
	}

	/**
	 * Handles mouse move event.
	 * @private
	 * @param {MouseEvent} event - Mouse event
	 * @returns {void}
	 */
	private onMouseMove(event: MouseEvent): void {
		this.mousePosition.set(event.clientX, event.clientY);
		
		if (this.isDragging) {
			const deltaX = event.clientX - this.lastMousePosition.x;
			const deltaY = event.clientY - this.lastMousePosition.y;
			this.pan(deltaX, deltaY);
			this.lastMousePosition.set(event.clientX, event.clientY);
		} else if (this.pressedSprite) {
			// Handle sprite dragging
			const delta = new THREE.Vector2(
				event.clientX - this.lastMousePosition.x,
				event.clientY - this.lastMousePosition.y
			);
			this.pressedSprite.events.emitEvent('drag', { 
				sprite: this.pressedSprite, 
				delta, 
				event 
			});
			this.lastMousePosition.set(event.clientX, event.clientY);
		} else {
			// Update last mouse position for potential drag start
			this.lastMousePosition.set(event.clientX, event.clientY);
			// Check for hover
			const sprite = this.getSpriteAtPosition(event.clientX, event.clientY);
			
			if (sprite !== this.hoveredSprite) {
				// Exit previous hover
				if (this.hoveredSprite) {
					console.log('Hover exit:', this.hoveredSprite);
					this.hoveredSprite.events.emitEvent('hover:exit', { 
						sprite: this.hoveredSprite, 
						event 
					});
				}
				
				// Enter new hover
				if (sprite) {
					console.log('Hover enter:', sprite);
					sprite.events.emitEvent('hover:enter', { 
						sprite, 
						event, 
						intersection: {} as THREE.Intersection 
					});
				}
				
				this.hoveredSprite = sprite;
			}
		}
	}

	/**
	 * Handles mouse up event.
	 * @private
	 * @param {MouseEvent} event - Mouse event
	 * @returns {void}
	 */
	private onMouseUp(event: MouseEvent): void {
		if (this.pressedSprite) {
			// Check if mouse is still over the pressed sprite for click
			const sprite = this.getSpriteAtPosition(event.clientX, event.clientY);
			
			if (sprite === this.pressedSprite) {
				// It's a click
				console.log('Click:', sprite);
				sprite.events.emitEvent('click', { 
					sprite, 
					event, 
					intersection: {} as THREE.Intersection 
				});
			}
			
			// End drag
			this.pressedSprite.events.emitEvent('drag:end', { 
				sprite: this.pressedSprite, 
				event, 
				endPosition: new THREE.Vector2(event.clientX, event.clientY) 
			});
			
			this.pressedSprite = null;
		}
		
		this.isDragging = false;
	}

	/**
	 * Handles mouse leave event.
	 * @private
	 * @param {MouseEvent} event - Mouse event
	 * @returns {void}
	 */
	private onMouseLeave(event: MouseEvent): void {
		// Clear hover state when mouse leaves canvas
		if (this.hoveredSprite) {
			console.log('Mouse left canvas, clearing hover');
			this.hoveredSprite.events.emitEvent('hover:exit', { 
				sprite: this.hoveredSprite, 
				event 
			});
			this.hoveredSprite = null;
		}
		
		// Cancel any drag operation
		if (this.pressedSprite) {
			this.pressedSprite.events.emitEvent('drag:end', { 
				sprite: this.pressedSprite, 
				event, 
				endPosition: new THREE.Vector2(event.clientX, event.clientY) 
			});
			this.pressedSprite = null;
		}
		
		this.isDragging = false;
	}

	/**
	 * Handles wheel event.
	 * @private
	 * @param {WheelEvent} event - Wheel event
	 * @returns {void}
	 */
	private onWheel(event: WheelEvent): void {
		event.preventDefault();
		const factor = event.deltaY > 0 ? 0.9 : 1.1;
		const rect = this.canvas.getBoundingClientRect();
		this.zoom(factor, event.clientX - rect.left, event.clientY - rect.top);
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

	/**
	 * Gets sprite at screen position.
	 * @private
	 * @param {number} x - Screen X coordinate
	 * @param {number} y - Screen Y coordinate
	 * @returns {Sprite | null} Sprite at position or null
	 */
	private getSpriteAtPosition(x: number, y: number): Sprite | null {
		const rect = this.canvas.getBoundingClientRect();
		const mouse = new THREE.Vector2(
			((x - rect.left) / rect.width) * 2 - 1,
			-((y - rect.top) / rect.height) * 2 + 1
		);
		
		this.raycaster.setFromCamera(mouse, this.camera);
		
		// Get all meshes from sprites
		const meshes: THREE.Mesh[] = [];
		const spriteMap = new Map<THREE.Mesh, Sprite>();
		
		this.scene.traverse((obj) => {
			if ('markNeedsUpdate' in obj && 'mesh' in obj) {
				const sprite = obj as unknown as Sprite;
				if (sprite.mesh) {
					meshes.push(sprite.mesh);
					spriteMap.set(sprite.mesh, sprite);
				}
			}
		});
		
		const intersects = this.raycaster.intersectObjects(meshes, false);
		
		if (intersects.length > 0) {
			const mesh = intersects[0].object as THREE.Mesh;
			return spriteMap.get(mesh) || null;
		}
		
		return null;
	}
}