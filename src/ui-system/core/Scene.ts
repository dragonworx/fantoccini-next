import * as THREE from 'three';
import { EventEmitter } from '@core/event-emitter';
import type { View } from './View';
import type { Sprite } from '../sprites/Sprite';

/**
 * Event map for Scene events.
 * @interface SceneEventMap
 * @memberof ui-system.core
 */
export interface SceneEventMap {
	'sprite:added': { sprite: Sprite };
	'sprite:removed': { sprite: Sprite };
	'render:start': { timestamp: number };
	'render:end': { timestamp: number; duration: number };
	'update:start': { updateCount: number };
	'update:end': { updateCount: number; duration: number };
}

/**
 * Scene class that extends THREE.Scene and manages multiple views.
 * Provides centralized update queue and event management.
 * 
 * @class Scene
 * @extends THREE.Scene
 * @memberof ui-system.core
 */
export class Scene extends THREE.Scene {
	/**
	 * Event emitter for scene events.
	 * @public
	 * @readonly
	 */
	public readonly events = new EventEmitter<SceneEventMap>();

	/**
	 * Set of views rendering this scene.
	 * @private
	 */
	private views: Set<View> = new Set();

	/**
	 * Queue of sprites that need updates.
	 * @private
	 */
	private updateQueue: Set<Sprite> = new Set();

	/**
	 * Creates a new Scene instance.
	 * @public
	 */
	public constructor() {
		super();
	}

	/**
	 * Adds a view to this scene.
	 * @public
	 * @param {View} view - The view to add
	 * @returns {void}
	 */
	public addView(view: View): void {
		this.views.add(view);
	}

	/**
	 * Removes a view from this scene.
	 * @public
	 * @param {View} view - The view to remove
	 * @returns {void}
	 */
	public removeView(view: View): void {
		this.views.delete(view);
	}

	/**
	 * Gets all views rendering this scene.
	 * @public
	 * @returns {Set<View>} Set of views
	 */
	public getViews(): Set<View> {
		return new Set(this.views);
	}

	/**
	 * Marks a sprite for update in the next update cycle.
	 * @public
	 * @param {Sprite} sprite - The sprite to update
	 * @returns {void}
	 */
	public markForUpdate(sprite: Sprite): void {
		this.updateQueue.add(sprite);
	}

	/**
	 * Processes all pending updates.
	 * @public
	 * @returns {void}
	 */
	public flushUpdates(): void {
		if (this.updateQueue.size === 0) return;

		const updateCount = this.updateQueue.size;
		this.events.emitEvent('update:start', { updateCount });
		const startTime = performance.now();

		this.updateQueue.forEach(sprite => {
			sprite.update();
		});
		this.updateQueue.clear();

		const duration = performance.now() - startTime;
		this.events.emitEvent('update:end', { updateCount, duration });
	}

	/**
	 * Renders all registered views.
	 * @public
	 * @returns {void}
	 */
	public renderAllViews(): void {
		this.events.emitEvent('render:start', { timestamp: performance.now() });
		const startTime = performance.now();

		this.flushUpdates();
		this.views.forEach(view => view.render());

		const duration = performance.now() - startTime;
		this.events.emitEvent('render:end', { timestamp: performance.now(), duration });
	}

	/**
	 * Override add method to emit events.
	 * @public
	 * @param {...THREE.Object3D[]} objects - Objects to add
	 * @returns {this}
	 */
	public add(...objects: THREE.Object3D[]): this {
		super.add(...objects);
		objects.forEach(obj => {
			if ('markNeedsUpdate' in obj) {
				this.events.emitEvent('sprite:added', { sprite: obj as unknown as Sprite });
			}
		});
		return this;
	}

	/**
	 * Override remove method to emit events.
	 * @public
	 * @param {...THREE.Object3D[]} objects - Objects to remove
	 * @returns {this}
	 */
	public remove(...objects: THREE.Object3D[]): this {
		super.remove(...objects);
		objects.forEach(obj => {
			if ('markNeedsUpdate' in obj) {
				this.events.emitEvent('sprite:removed', { sprite: obj as unknown as Sprite });
			}
		});
		return this;
	}
}