import * as THREE from 'three';
import { EventEmitter } from '@core/event-emitter';
import { Scene } from './Scene';

/**
 * Event map for View events.
 * @interface ViewEventMap
 * @memberof ui-system.core
 */
export interface ViewEventMap {
	'resize': { width: number; height: number };
	'camera:change': { camera: THREE.Camera };
	'viewport:change': { x: number; y: number; width: number; height: number };
	'render': { timestamp: number };
	'focus': { view: View };
	'blur': { view: View };
}

/**
 * Input event type for view handling.
 * @type InputEvent
 */
export type InputEvent = MouseEvent | TouchEvent | PointerEvent | KeyboardEvent;

/**
 * Abstract base class for all view types.
 * Manages rendering pipeline and viewport control.
 * 
 * @abstract
 * @class View
 * @memberof ui-system.core
 */
export abstract class View {
	/**
	 * Event emitter for view events.
	 * @public
	 * @readonly
	 */
	public readonly events = new EventEmitter<ViewEventMap>();

	/**
	 * Canvas element for rendering.
	 * @public
	 * @readonly
	 */
	public readonly canvas: HTMLCanvasElement;

	/**
	 * WebGL renderer instance.
	 * @public
	 * @readonly
	 */
	public readonly renderer: THREE.WebGLRenderer;

	/**
	 * Scene being rendered.
	 * @public
	 * @readonly
	 */
	public readonly scene: Scene;

	/**
	 * Camera used for rendering.
	 * @public
	 * @readonly
	 */
	public readonly camera: THREE.Camera;

	/**
	 * Viewport configuration.
	 * @protected
	 */
	protected viewport: { x: number; y: number; width: number; height: number };

	/**
	 * Flag indicating if resize is needed.
	 * @protected
	 */
	protected needsResize: boolean = false;

	/**
	 * Creates a new View instance.
	 * @public
	 * @param {Scene} scene - The scene to render
	 * @param {THREE.Camera} camera - The camera to use
	 * @param {HTMLCanvasElement} [canvas] - Optional canvas element
	 */
	public constructor(scene: Scene, camera: THREE.Camera, canvas?: HTMLCanvasElement) {
		this.scene = scene;
		this.camera = camera;
		this.canvas = canvas || document.createElement('canvas');
		
		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true,
			alpha: true
		});
		this.renderer.setPixelRatio(window.devicePixelRatio);
		
		this.viewport = {
			x: 0,
			y: 0,
			width: this.canvas.width,
			height: this.canvas.height
		};

		// Auto-register with scene
		this.scene.addView(this);
	}

	/**
	 * Renders the view.
	 * @public
	 * @abstract
	 * @returns {void}
	 */
	public abstract render(): void;

	/**
	 * Resizes the view.
	 * @public
	 * @abstract
	 * @param {number} width - New width
	 * @param {number} height - New height
	 * @returns {void}
	 */
	public abstract resize(width: number, height: number): void;

	/**
	 * Handles input events.
	 * @public
	 * @abstract
	 * @param {InputEvent} event - The input event
	 * @returns {boolean} True if event was consumed
	 */
	public abstract handleInput(event: InputEvent): boolean;

	/**
	 * Gets the camera.
	 * @public
	 * @returns {THREE.Camera} The camera
	 */
	public getCamera(): THREE.Camera {
		return this.camera;
	}

	/**
	 * Gets the renderer.
	 * @public
	 * @returns {THREE.WebGLRenderer} The renderer
	 */
	public getRenderer(): THREE.WebGLRenderer {
		return this.renderer;
	}

	/**
	 * Gets the scene.
	 * @public
	 * @returns {Scene} The scene
	 */
	public getScene(): Scene {
		return this.scene;
	}

	/**
	 * Sets the viewport.
	 * @public
	 * @param {number} x - X position
	 * @param {number} y - Y position
	 * @param {number} width - Width
	 * @param {number} height - Height
	 * @returns {void}
	 */
	public setViewport(x: number, y: number, width: number, height: number): void {
		this.viewport = { x, y, width, height };
		this.events.emitEvent('viewport:change', this.viewport);
	}

	/**
	 * Gets the viewport.
	 * @public
	 * @returns {{ x: number; y: number; width: number; height: number }} The viewport
	 */
	public getViewport(): { x: number; y: number; width: number; height: number } {
		return { ...this.viewport };
	}

	/**
	 * Base render implementation.
	 * @protected
	 * @returns {void}
	 */
	protected baseRender(): void {
		this.renderer.setViewport(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
		this.renderer.setScissor(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
		this.renderer.setScissorTest(true);
		this.renderer.render(this.scene, this.camera);
		this.events.emitEvent('render', { timestamp: performance.now() });
	}

	/**
	 * Disposes of view resources.
	 * @public
	 * @returns {void}
	 */
	public dispose(): void {
		this.scene.removeView(this);
		this.renderer.dispose();
		this.events.dispose();
	}
}