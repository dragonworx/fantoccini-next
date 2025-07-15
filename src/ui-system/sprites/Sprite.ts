import * as THREE from 'three';
import { EventEmitter } from '@core/event-emitter';
import type { Material } from '../materials/Material';

/**
 * Event map for Sprite events.
 * @interface SpriteEventMap
 * @memberof ui-system.sprites
 */
export interface SpriteEventMap {
	'click': { sprite: Sprite; event: MouseEvent; intersection: THREE.Intersection };
	'hover:enter': { sprite: Sprite; event: MouseEvent; intersection: THREE.Intersection };
	'hover:exit': { sprite: Sprite; event: MouseEvent };
	'drag:start': { sprite: Sprite; event: MouseEvent; startPosition: THREE.Vector2 };
	'drag': { sprite: Sprite; delta: THREE.Vector2; event: MouseEvent };
	'drag:end': { sprite: Sprite; event: MouseEvent; endPosition: THREE.Vector2 };
	'transform': { sprite: Sprite; transform: THREE.Matrix4 };
	'resize': { sprite: Sprite; oldSize: THREE.Vector2; newSize: THREE.Vector2 };
	'focus': { sprite: Sprite };
	'blur': { sprite: Sprite };
	'destroy': { sprite: Sprite };
}

/**
 * Abstract base class for all renderable objects.
 * Extends THREE.Object3D while adding size, origin, and update management.
 * 
 * @abstract
 * @class Sprite
 * @extends THREE.Object3D
 * @memberof ui-system.sprites
 */
export abstract class Sprite extends THREE.Object3D {
	/**
	 * Event emitter for sprite events.
	 * @public
	 * @readonly
	 */
	public readonly events = new EventEmitter<SpriteEventMap>();

	/**
	 * Size of the sprite.
	 * @protected
	 */
	protected _size: THREE.Vector2 = new THREE.Vector2(100, 100);

	/**
	 * Origin point (0-1 normalized).
	 * @protected
	 */
	protected _origin: THREE.Vector2 = new THREE.Vector2(0.5, 0.5);

	/**
	 * Flag indicating update needed.
	 * @protected
	 */
	protected _needsUpdate: boolean = true;

	/**
	 * Material for rendering.
	 * @protected
	 */
	protected _material: Material | null = null;

	/**
	 * Creates a new Sprite instance.
	 * @public
	 * @param {Material} [material] - Optional material
	 */
	public constructor(material?: Material) {
		super();
		if (material) {
			this._material = material;
		}
	}

	/**
	 * Gets the size.
	 * @public
	 * @returns {THREE.Vector2} The size
	 */
	public get size(): THREE.Vector2 {
		return this._size.clone();
	}

	/**
	 * Sets the size.
	 * @public
	 * @param {THREE.Vector2} value - New size
	 * @returns {void}
	 */
	public set size(value: THREE.Vector2) {
		const oldSize = this._size.clone();
		this._size.copy(value);
		this.markNeedsUpdate();
		this.events.emitEvent('resize', { sprite: this, oldSize, newSize: this._size.clone() });
	}

	/**
	 * Gets the origin.
	 * @public
	 * @returns {THREE.Vector2} The origin (0-1 normalized)
	 */
	public get origin(): THREE.Vector2 {
		return this._origin.clone();
	}

	/**
	 * Sets the origin.
	 * @public
	 * @param {THREE.Vector2} value - New origin (0-1 normalized)
	 * @returns {void}
	 */
	public set origin(value: THREE.Vector2) {
		this._origin.copy(value);
		this.markNeedsUpdate();
	}

	/**
	 * Gets the material.
	 * @public
	 * @returns {Material | null} The material
	 */
	public get material(): Material | null {
		return this._material;
	}

	/**
	 * Sets the material.
	 * @public
	 * @param {Material | null} value - New material
	 * @returns {void}
	 */
	public set material(value: Material | null) {
		this._material = value;
		this.updateMaterial();
	}

	/**
	 * Marks sprite as needing update.
	 * @public
	 * @returns {void}
	 */
	public markNeedsUpdate(): void {
		this._needsUpdate = true;
		// Mark in scene update queue if attached
		if (this.parent) {
			let scene = this.parent;
			while (scene.parent) {
				scene = scene.parent;
			}
			if ('markForUpdate' in scene) {
				(scene as any).markForUpdate(this);
			}
		}
	}

	/**
	 * Updates sprite geometry.
	 * @public
	 * @abstract
	 * @returns {void}
	 */
	public abstract updateGeometry(): void;

	/**
	 * Updates sprite material.
	 * @public
	 * @abstract
	 * @returns {void}
	 */
	public abstract updateMaterial(): void;

	/**
	 * Updates the sprite.
	 * @public
	 * @returns {void}
	 */
	public update(): void {
		if (!this._needsUpdate) return;
		
		this.updateGeometry();
		if (this._material && this._material.needsUpdate()) {
			this.updateMaterial();
		}
		
		this._needsUpdate = false;
	}

	/**
	 * Adds a child sprite.
	 * @public
	 * @param {Sprite} child - Child sprite
	 * @returns {void}
	 */
	public addChild(child: Sprite): void {
		this.add(child);
	}

	/**
	 * Removes a child sprite.
	 * @public
	 * @param {Sprite} child - Child sprite
	 * @returns {void}
	 */
	public removeChild(child: Sprite): void {
		this.remove(child);
	}

	/**
	 * Gets child sprites.
	 * @public
	 * @returns {Sprite[]} Array of child sprites
	 */
	public getChildren(): Sprite[] {
		return this.children.filter(child => child instanceof Sprite) as Sprite[];
	}

	/**
	 * Gets the mesh.
	 * @public
	 * @abstract
	 * @returns {THREE.Mesh} The mesh
	 */
	public abstract get mesh(): THREE.Mesh;

	/**
	 * Gets the geometry.
	 * @public
	 * @returns {THREE.BufferGeometry} The geometry
	 */
	public get geometry(): THREE.BufferGeometry {
		return this.mesh.geometry;
	}

	/**
	 * Handles pointer events.
	 * @public
	 * @param {PointerEvent} event - Pointer event
	 * @param {THREE.Camera} camera - Camera for raycasting
	 * @returns {boolean} True if event was handled
	 */
	public handlePointerEvent(event: PointerEvent, camera: THREE.Camera): boolean {
		// To be implemented with InputManager
		return false;
	}

	/**
	 * Destroys the sprite.
	 * @public
	 * @returns {void}
	 */
	public destroy(): void {
		this.events.emitEvent('destroy', { sprite: this });
		this.events.dispose();
		
		// Clean up geometry and material
		if (this.mesh) {
			if (this.mesh.geometry) {
				this.mesh.geometry.dispose();
			}
			if (this.mesh.material) {
				if (Array.isArray(this.mesh.material)) {
					this.mesh.material.forEach(m => m.dispose());
				} else {
					this.mesh.material.dispose();
				}
			}
		}
		
		// Remove from parent
		if (this.parent) {
			this.parent.remove(this);
		}
	}

	/**
	 * Override matrix update to emit transform event.
	 * @public
	 * @override
	 * @returns {void}
	 */
	public updateMatrix(): void {
		super.updateMatrix();
		this.events.emitEvent('transform', { sprite: this, transform: this.matrix.clone() });
	}
}