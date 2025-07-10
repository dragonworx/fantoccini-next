import { Sprite } from '../sprite';

/**
 * @namespace core
 */

/**
 * Configuration options for creating a Scene.
 * @interface SceneOptions
 * @memberof core
 *
 * @property {Sprite} [root] - The root sprite that serves as the container for all scene elements
 * @property {number} [frameRate=60] - Target frame rate in frames per second
 *
 * @example
 * const options: SceneOptions = {
 *   root: customRootSprite,
 *   frameRate: 30
 * };
 * const scene = new Scene(options);
 */
export interface SceneOptions {
  root?: Sprite;
  frameRate?: number; // frames per second, default 60
}

/**
 * Manages a hierarchical scene of sprites with frame-rate controlled rendering.
 *
 * A Scene represents the top-level container for a visual composition,
 * handling the animation loop and sprite updates.
 *
 * @class Scene
 * @memberof core
 *
 * @example
 * // Create a basic scene
 * const scene = new Scene();
 *
 * // Add a sprite to the scene
 * const sprite = new Sprite();
 * sprite.appendTo(scene.root.el);
 *
 * // Start the scene's animation loop
 * scene.start();
 *
 * @see Sprite
 */
export class Scene {
	/**
   * The root sprite that contains all other elements in the scene.
   * @type {Sprite}
   */
	public root: Sprite;

	/** Target frame rate in frames per second */
	private _frameRate: number;
	/** Whether the animation loop is currently running */
	private _running: boolean = false;
	/** Timestamp of the last frame render */
	private _lastFrameTime: number = 0;
	/** Current animation frame request ID */
	private _frameRequest: number | null = null;

	/**
   * Creates a new Scene instance.
   *
   * @param {SceneOptions} [options={}] - Configuration options for the scene
   *
   * @example
   * // Create a scene with default options (60fps)
   * const defaultScene = new Scene();
   *
   * // Create a scene with custom options
   * const customScene = new Scene({
   *   frameRate: 30,
   *   root: new Sprite({ fill: { type: "color", value: "#000" } })
   * });
   */
	public constructor(options: SceneOptions = {}) {
		this.root = options.root || new Sprite();
		this._frameRate = options.frameRate ?? 60;
	}

	/**
   * Gets the current target frame rate in frames per second.
   *
   * @returns {number} Current frame rate
   */
	public get frameRate(): number {
		return this._frameRate;
	}

	/**
   * Sets the target frame rate in frames per second.
   * The value will be clamped to a minimum of 1fps.
   *
   * @param {number} rate - New frame rate to set
   */
	public set frameRate(rate: number) {
		this._frameRate = Math.max(1, rate);
	}

	/**
   * Starts the scene's animation loop.
   * If the scene is already running, this method has no effect.
   *
   * @returns {void}
   *
   * @example
   * const scene = new Scene();
   * scene.start(); // Begin animation loop
   */
	public start(): void {
		if (!this._running) {
			this._running = true;
			this._lastFrameTime = performance.now();
			this._frameRequest = requestAnimationFrame(this._frameLoop);
		}
	}

	/**
   * Stops the scene's animation loop.
   * Cancels any pending animation frame requests.
   *
   * @returns {void}
   *
   * @example
   * const scene = new Scene();
   * scene.start();
   * // Later...
   * scene.stop(); // Halt animation loop
   */
	public stop(): void {
		this._running = false;
		if (this._frameRequest !== null) {
			cancelAnimationFrame(this._frameRequest);
			this._frameRequest = null;
		}
	}

	/**
   * Animation frame callback that manages the timing of updates.
   * Ensures updates run at the target frame rate by throttling calls.
   *
   * @param {number} now - Current timestamp from requestAnimationFrame
   * @returns {void}
   */
	private _frameLoop = (now: number): void => {
		if (!this._running) {
			return;
		}
		const minFrameTime = 1000 / this._frameRate;
		if (now - this._lastFrameTime >= minFrameTime) {
			this._lastFrameTime = now;
			this.update();
		}
		this._frameRequest = requestAnimationFrame(this._frameLoop);
	};

	/**
   * Recursively updates all dirty sprites in the scene graph.
   * This method is called automatically by the animation loop,
   * but can also be called manually for immediate updates.
   *
   * @returns {void}
   *
   * @example
   * // Force an immediate update of all sprites
   * scene.update();
   */
	public update(): void {
		this._updateSpriteRecursive(this.root);
	}

	/**
   * Recursively processes sprites, updating their styles if dirty.
   * Traverses the sprite hierarchy depth-first.
   *
   * @param {Sprite} sprite - The sprite to update, along with its descendants
   * @returns {void}
   */
	private _updateSpriteRecursive(sprite: Sprite): void {
		if (sprite.dirty) {
			sprite.updateStyle();
		}
		// If Sprite supports children, walk them here.
		// For now, check if sprite.children exists and is iterable.
		const children = sprite.children;
		if (Array.isArray(children)) {
			for (const child of children) {
				this._updateSpriteRecursive(child);
			}
		}
	}
}
