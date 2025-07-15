import * as THREE from 'three';
import { Sprite } from './Sprite';
import type { Material } from '../materials/Material';

/**
 * LOD level configuration.
 * @interface LODLevel
 * @memberof ui-system.sprites
 */
export interface LODLevel {
	distance: number;
	geometry: THREE.BufferGeometry;
}

/**
 * General-purpose 3D object wrapper that maintains sprite interface.
 * 
 * @class Sprite3D
 * @extends Sprite
 * @memberof ui-system.sprites
 */
export class Sprite3D extends Sprite {
	/**
	 * Mesh instance.
	 * @private
	 */
	private _mesh: THREE.Mesh;

	/**
	 * Animation mixer for animations.
	 * @private
	 */
	private animationMixer: THREE.AnimationMixer | null = null;

	/**
	 * Animation clips map.
	 * @private
	 */
	private animationClips = new Map<string, THREE.AnimationClip>();

	/**
	 * Current animation actions.
	 * @private
	 */
	private animationActions = new Map<string, THREE.AnimationAction>();

	/**
	 * LOD object if using level of detail.
	 * @private
	 */
	private lod: THREE.LOD | null = null;

	/**
	 * Creates a new Sprite3D instance.
	 * @public
	 * @param {THREE.BufferGeometry} geometry - The geometry
	 * @param {Material} [material] - Optional material
	 */
	public constructor(geometry: THREE.BufferGeometry, material?: Material) {
		super(material);
		
		// Create default material if none provided
		const defaultMaterial = new THREE.MeshPhongMaterial({
			color: 0xffffff,
			side: THREE.DoubleSide
		});
		
		// Create mesh
		this._mesh = new THREE.Mesh(geometry, material?.threeMaterial || defaultMaterial);
		this.add(this._mesh);
		
		// Calculate initial size from bounding box
		this.updateSizeFromBounds();
	}

	/**
	 * Gets the mesh.
	 * @public
	 * @override
	 * @returns {THREE.Mesh} The mesh
	 */
	public get mesh(): THREE.Mesh {
		return this._mesh;
	}

	/**
	 * Gets the geometry.
	 * @public
	 * @override
	 * @returns {THREE.BufferGeometry} The geometry
	 */
	public get geometry(): THREE.BufferGeometry {
		return this._mesh.geometry;
	}

	/**
	 * Sets the geometry.
	 * @public
	 * @param {THREE.BufferGeometry} value - New geometry
	 * @returns {void}
	 */
	public set geometry(value: THREE.BufferGeometry) {
		// Dispose old geometry
		if (this._mesh.geometry) {
			this._mesh.geometry.dispose();
		}
		
		this._mesh.geometry = value;
		this.updateSizeFromBounds();
		this.markNeedsUpdate();
	}

	/**
	 * Sets shadow casting.
	 * @public
	 * @param {boolean} cast - Whether to cast shadows
	 * @returns {void}
	 */
	public setCastShadow(cast: boolean): void {
		this.castShadow = cast;
		this._mesh.castShadow = cast;
		if (this.lod) {
			this.lod.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.castShadow = cast;
				}
			});
		}
	}

	/**
	 * Sets shadow receiving.
	 * @public
	 * @param {boolean} receive - Whether to receive shadows
	 * @returns {void}
	 */
	public setReceiveShadow(receive: boolean): void {
		this.receiveShadow = receive;
		this._mesh.receiveShadow = receive;
		if (this.lod) {
			this.lod.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.receiveShadow = receive;
				}
			});
		}
	}

	/**
	 * Sets level of detail.
	 * @public
	 * @param {LODLevel[]} levels - LOD levels
	 * @returns {void}
	 */
	public setLOD(levels: LODLevel[]): void {
		// Remove existing LOD
		if (this.lod) {
			this.remove(this.lod);
			this.lod = null;
		}
		
		// Remove base mesh if using LOD
		if (levels.length > 0) {
			this.remove(this._mesh);
			
			// Create LOD object
			this.lod = new THREE.LOD();
			
			// Add levels
			levels.forEach(level => {
				const lodMesh = new THREE.Mesh(level.geometry, this._mesh.material);
				lodMesh.castShadow = this._mesh.castShadow;
				lodMesh.receiveShadow = this._mesh.receiveShadow;
				this.lod!.addLevel(lodMesh, level.distance);
			});
			
			this.add(this.lod);
		}
	}

	/**
	 * Computes bounding box.
	 * @public
	 * @returns {THREE.Box3} The bounding box
	 */
	public computeBoundingBox(): THREE.Box3 {
		const box = new THREE.Box3();
		
		if (this.lod) {
			box.setFromObject(this.lod);
		} else {
			box.setFromObject(this._mesh);
		}
		
		return box;
	}

	/**
	 * Updates geometry.
	 * @public
	 * @override
	 * @returns {void}
	 */
	public updateGeometry(): void {
		// Apply origin offset by adjusting mesh position
		const bounds = this.computeBoundingBox();
		const size = bounds.getSize(new THREE.Vector3());
		const center = bounds.getCenter(new THREE.Vector3());
		
		const offsetX = -size.x * (this._origin.x - 0.5);
		const offsetY = -size.y * (this._origin.y - 0.5);
		const offsetZ = 0;
		
		if (this.lod) {
			this.lod.position.set(offsetX - center.x, offsetY - center.y, offsetZ - center.z);
		} else {
			this._mesh.position.set(offsetX - center.x, offsetY - center.y, offsetZ - center.z);
		}
	}

	/**
	 * Updates material.
	 * @public
	 * @override
	 * @returns {void}
	 */
	public updateMaterial(): void {
		if (this._material) {
			this._mesh.material = this._material.threeMaterial;
			
			// Update LOD materials
			if (this.lod) {
				this.lod.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						child.material = this._material!.threeMaterial;
					}
				});
			}
			
			this._material.update();
		}
	}

	/**
	 * Adds an animation clip.
	 * @public
	 * @param {string} name - Animation name
	 * @param {THREE.AnimationClip} animation - Animation clip
	 * @returns {void}
	 */
	public addAnimation(name: string, animation: THREE.AnimationClip): void {
		this.animationClips.set(name, animation);
		
		// Create mixer if needed
		if (!this.animationMixer) {
			this.animationMixer = new THREE.AnimationMixer(this.lod || this._mesh);
		}
		
		// Create action
		const action = this.animationMixer.clipAction(animation);
		this.animationActions.set(name, action);
	}

	/**
	 * Plays an animation.
	 * @public
	 * @param {string} name - Animation name
	 * @returns {void}
	 */
	public playAnimation(name: string): void {
		const action = this.animationActions.get(name);
		if (action) {
			action.reset();
			action.play();
		}
	}

	/**
	 * Stops an animation.
	 * @public
	 * @param {string} name - Animation name
	 * @returns {void}
	 */
	public stopAnimation(name: string): void {
		const action = this.animationActions.get(name);
		if (action) {
			action.stop();
		}
	}

	/**
	 * Updates animations.
	 * @public
	 * @param {number} deltaTime - Time delta
	 * @returns {void}
	 */
	public updateAnimations(deltaTime: number): void {
		if (this.animationMixer) {
			this.animationMixer.update(deltaTime);
		}
	}

	/**
	 * Updates size from geometry bounds.
	 * @private
	 * @returns {void}
	 */
	private updateSizeFromBounds(): void {
		const bounds = this.computeBoundingBox();
		const size = bounds.getSize(new THREE.Vector3());
		this._size.set(size.x, size.y);
	}

	/**
	 * Destroys the sprite.
	 * @public
	 * @override
	 * @returns {void}
	 */
	public destroy(): void {
		// Stop all animations
		if (this.animationMixer) {
			this.animationMixer.stopAllAction();
			this.animationMixer.uncacheRoot(this.lod || this._mesh);
		}
		
		// Dispose LOD
		if (this.lod) {
			this.lod.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					if (child.geometry) child.geometry.dispose();
					if (child.material) {
						if (Array.isArray(child.material)) {
							child.material.forEach(m => m.dispose());
						} else {
							child.material.dispose();
						}
					}
				}
			});
		}
		
		super.destroy();
	}
}