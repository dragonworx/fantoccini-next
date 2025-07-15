/**
 * View class - top-level rendering context
 * @namespace core.ui
 * @memberof core.ui
 */

import * as THREE from 'three';
import { Container } from './elements/container';
import type { Element } from './elements/element';
import type { IViewConfig } from './types';
import { DirtyFlags } from './types';

/**
 * Top-level container that manages rendering and scene management
 * @memberof core.ui
 */
export class View {
	// Canvas and renderer
	public canvas: HTMLCanvasElement;
	public renderer: THREE.WebGLRenderer;
	
	// Scene and camera
	public scene: THREE.Scene;
	public camera: THREE.OrthographicCamera;
	
	// Root container
	public root: Container | null = null;
	
	// Dirty tracking
	private dirtyElements = new Set<Element>();
	private updateQueued = false;
	
	// Render loop
	private autoRender: boolean;
	private rafId: number | null = null;
	private lastUpdateTime = 0;
	
	// Performance metrics
	public fps = 0;
	public renderTime = 0;
	
	// Size
	private width: number;
	private height: number;

	/**
	 * Creates a new View
	 */
	public constructor(config: IViewConfig | HTMLCanvasElement = {}) {
		// Handle both IViewConfig and direct canvas
		if (config instanceof HTMLCanvasElement) {
			this.canvas = config;
			this.width = config.width;
			this.height = config.height;
			this.autoRender = true;
		} else {
			// Create or use provided canvas
			this.canvas = config.canvas || document.createElement('canvas');
			this.width = config.width || this.canvas.width || 800;
			this.height = config.height || this.canvas.height || 600;
			this.autoRender = config.autoRender !== false;
		}
		
		// Set canvas size
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		
		// Create renderer
		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true,
			alpha: false
		});
		this.renderer.setClearColor(0xfafafa, 1);
		this.renderer.setPixelRatio(config.pixelRatio || window.devicePixelRatio || 1);
		this.renderer.setSize(this.width, this.height);
		
		// Create scene
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0xfafafa); // Light background
		
		// Add ambient light for better visibility
		const ambientLight = new THREE.AmbientLight(0xffffff, 1);
		this.scene.add(ambientLight);
		
		// Create orthographic camera for 2D UI
		// Set up camera with Y-down coordinate system (0,0 at top-left)
		this.camera = new THREE.OrthographicCamera(
			0, this.width,     // left, right
			this.height, 0,    // top, bottom (Y-down: top=height, bottom=0)
			0.1, 1000         // near, far
		);
		this.camera.position.set(this.width / 2, this.height / 2, 100);
		this.camera.lookAt(this.width / 2, this.height / 2, 0);
		this.camera.updateProjectionMatrix();
		
		// View created successfully
		
		// Setup event handling
		this.setupEventHandling();
	}

	/**
	 * Set root container
	 */
	public setRoot(root: Container): void {
		// Remove old root
		if (this.root) {
			this.scene.remove(this.root.getMesh()!);
			this.root.view = null;
			this.root.unmount();
		}
		
		// Set new root
		this.root = root;
		root.view = this;
		
		// Mount and add to scene
		root.mount();
		const mesh = root.getMesh();
		if (mesh) {
			// Reset root transform to prevent double positioning
			mesh.position.set(0, 0, 0);
			mesh.scale.set(1, 1, 1);
			this.scene.add(mesh);
		} else {
			console.warn('Root container has no mesh!');
		}
		
		// Calculate initial layout
		root.calcLayout();
		
		// Mark all as dirty for initial render
		this.markDirty(root, DirtyFlags.All);
	}

	/**
	 * Get root container
	 */
	public getRoot(): Container | null {
		return this.root;
	}

	/**
	 * Mark element as dirty
	 */
	public markDirty(element: Element, flags: DirtyFlags): void {
		element.dirtyFlags |= flags;
		this.dirtyElements.add(element);
		
		// In automatic mode, schedule update
		if (this.autoRender && !this.updateQueued) {
			this.updateQueued = true;
			requestAnimationFrame(() => this.processUpdates());
		}
	}

	/**
	 * Check if update needed
	 */
	public needsUpdate(): boolean {
		return this.dirtyElements.size > 0;
	}

	/**
	 * Update with optional delta time
	 */
	public update(_deltaTime?: number): void {
		this.processUpdates();
	}

	/**
	 * Process all pending updates
	 */
	private processUpdates(): void {
		const startTime = performance.now();
		
		// Quick exit if nothing to update
		if (this.dirtyElements.size === 0) {
			this.updateQueued = false;
			return;
		}
		
		// Update all dirty elements
		for (const element of this.dirtyElements) {
			element.update();
		}
		
		// Clear dirty elements
		this.dirtyElements.clear();
		this.updateQueued = false;
		
		// Render
		this.renderer.render(this.scene, this.camera);
		
		// Track performance
		this.renderTime = performance.now() - startTime;
	}

	/**
	 * Render the scene
	 */
	public render(): void {
		// Process any pending updates first
		if (this.needsUpdate()) {
			this.processUpdates();
		} else {
			// Just render if no updates needed
			this.renderer.render(this.scene, this.camera);
		}
	}

	/**
	 * Start automatic render loop
	 */
	public startRenderLoop(): void {
		if (this.rafId !== null) {
			return;
		}
		
		const animate = (): void => {
			this.rafId = requestAnimationFrame(animate);
			
			// Process updates if needed
			if (this.needsUpdate()) {
				this.processUpdates();
			}
		};
		
		animate();
	}

	/**
	 * Stop automatic render loop
	 */
	public stopRenderLoop(): void {
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}

	/**
	 * Resize view
	 */
	public resize(width: number, height: number): void {
		this.width = width;
		this.height = height;
		
		// Update canvas
		this.canvas.width = width;
		this.canvas.height = height;
		
		// Update renderer
		this.renderer.setSize(width, height);
		
		// Update camera
		this.camera.right = width;
		this.camera.bottom = height;  // Y-down coordinate system
		this.camera.updateProjectionMatrix();
		
		// Mark root for layout recalc
		if (this.root) {
			this.root.geometry = { width, height };
			this.root.calcLayout();
			this.markDirty(this.root, DirtyFlags.All);
		}
	}

	/**
	 * Set pixel ratio
	 */
	public setPixelRatio(ratio: number): void {
		this.renderer.setPixelRatio(ratio);
	}

	/**
	 * Pick element at coordinates
	 */
	public pick(x: number, y: number): Element | null {
		if (!this.root) {
			return null;
		}
		
		const hits = this.pickAll(x, y);
		return hits.length > 0 ? hits[0] : null;
	}

	/**
	 * Pick all elements at coordinates
	 */
	public pickAll(x: number, y: number): Element[] {
		if (!this.root) {
			return [];
		}
		
		// Convert to UI coordinates (Y-down)
		const uiY = y;
		
		// Start with root
		const hits: Element[] = [];
		if (this.root.hitTest(x, uiY)) {
			hits.push(this.root);
			hits.push(...this.root.getChildrenAt(x, uiY));
		}
		
		return hits;
	}

	/**
	 * Setup event handling
	 */
	private setupEventHandling(): void {
		// Mouse events
		this.canvas.addEventListener('click', this.handleMouseEvent.bind(this));
		this.canvas.addEventListener('mousedown', this.handleMouseEvent.bind(this));
		this.canvas.addEventListener('mouseup', this.handleMouseEvent.bind(this));
		this.canvas.addEventListener('mousemove', this.handleMouseEvent.bind(this));
		this.canvas.addEventListener('mouseenter', this.handleMouseEvent.bind(this));
		this.canvas.addEventListener('mouseleave', this.handleMouseEvent.bind(this));
		
		// Touch events
		this.canvas.addEventListener('touchstart', this.handleTouchEvent.bind(this));
		this.canvas.addEventListener('touchmove', this.handleTouchEvent.bind(this));
		this.canvas.addEventListener('touchend', this.handleTouchEvent.bind(this));
	}

	/**
	 * Handle mouse events
	 */
	private handleMouseEvent(event: MouseEvent): void {
		const rect = this.canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		
		// Find target element
		const target = this.pick(x, y);
		if (target && target.interactive) {
			target.emit(event.type, { x, y, event });
		}
	}

	/**
	 * Handle touch events
	 */
	private handleTouchEvent(event: TouchEvent): void {
		if (event.touches.length === 0) {
			return;
		}
		
		const rect = this.canvas.getBoundingClientRect();
		const touch = event.touches[0];
		const x = touch.clientX - rect.left;
		const y = touch.clientY - rect.top;
		
		// Find target element
		const target = this.pick(x, y);
		if (target && target.interactive) {
			target.emit(event.type, { x, y, event });
		}
	}

	/**
	 * Dispose of view resources
	 */
	public dispose(): void {
		// Stop render loop
		this.stopRenderLoop();
		
		// Remove root
		if (this.root) {
			const mesh = this.root.getMesh();
			if (mesh) {
				this.scene.remove(mesh);
			}
			this.root.view = null;
			this.root.unmount();
			this.root = null;
		}
		
		// Dispose renderer
		this.renderer.dispose();
		
		// Clear references
		this.dirtyElements.clear();
	}
}