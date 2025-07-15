import * as THREE from 'three';
import { Material, type MaterialOptions } from './Material';

/**
 * Physical material options.
 * @interface PhysicalMaterialOptions
 * @extends MaterialOptions
 * @memberof ui-system.materials
 */
export interface PhysicalMaterialOptions extends MaterialOptions {
	color?: string | number | THREE.Color;
	metalness?: number;
	roughness?: number;
	map?: THREE.Texture;
	normalMap?: THREE.Texture;
	metalnessMap?: THREE.Texture;
	roughnessMap?: THREE.Texture;
	envMap?: THREE.CubeTexture;
	envMapIntensity?: number;
	clearcoat?: number;
	clearcoatRoughness?: number;
	transmission?: number;
	thickness?: number;
	ior?: number;
}

/**
 * PBR material for 3D objects with realistic lighting.
 * 
 * @class PhysicalMaterial
 * @extends Material
 * @memberof ui-system.materials
 */
export class PhysicalMaterial extends Material {
	/**
	 * Creates a new PhysicalMaterial instance.
	 * @public
	 * @param {PhysicalMaterialOptions} [options={}] - Material options
	 */
	public constructor(options: PhysicalMaterialOptions = {}) {
		super(options);
		
		// Create physical material
		this._threeMaterial = new THREE.MeshPhysicalMaterial({
			color: options.color || 0xffffff,
			metalness: options.metalness ?? 0,
			roughness: options.roughness ?? 1,
			transparent: options.transparent ?? false,
			opacity: options.opacity ?? 1,
			side: options.side ?? THREE.FrontSide,
			depthWrite: options.depthWrite ?? true,
			depthTest: options.depthTest ?? true,
			map: options.map,
			normalMap: options.normalMap,
			metalnessMap: options.metalnessMap,
			roughnessMap: options.roughnessMap,
			envMap: options.envMap,
			envMapIntensity: options.envMapIntensity ?? 1,
			clearcoat: options.clearcoat ?? 0,
			clearcoatRoughness: options.clearcoatRoughness ?? 0,
			transmission: options.transmission ?? 0,
			thickness: options.thickness ?? 0,
			ior: options.ior ?? 1.5
		});
	}

	/**
	 * Gets the physical material.
	 * @private
	 * @returns {THREE.MeshPhysicalMaterial} The physical material
	 */
	private get physicalMaterial(): THREE.MeshPhysicalMaterial {
		return this._threeMaterial as THREE.MeshPhysicalMaterial;
	}

	/**
	 * Sets the color.
	 * @public
	 * @override
	 * @param {string | number | THREE.Color} color - The color
	 * @returns {void}
	 */
	public setColor(color: string | number | THREE.Color): void {
		this.physicalMaterial.color.set(color as any);
		this.markNeedsUpdate();
	}

	/**
	 * Sets the opacity.
	 * @public
	 * @override
	 * @param {number} opacity - The opacity
	 * @returns {void}
	 */
	public setOpacity(opacity: number): void {
		this.physicalMaterial.opacity = Math.max(0, Math.min(1, opacity));
		this.physicalMaterial.transparent = opacity < 1;
		this.markNeedsUpdate();
	}

	/**
	 * Sets the texture.
	 * @public
	 * @override
	 * @param {THREE.Texture | null} texture - The texture
	 * @returns {void}
	 */
	public setTexture(texture: THREE.Texture | null): void {
		this.physicalMaterial.map = texture;
		if (texture) {
			this.events.emitEvent('texture:load', { material: this, texture });
		}
		this.markNeedsUpdate();
	}

	/**
	 * Sets the metalness.
	 * @public
	 * @param {number} metalness - Metalness value (0-1)
	 * @returns {void}
	 */
	public setMetalness(metalness: number): void {
		this.physicalMaterial.metalness = Math.max(0, Math.min(1, metalness));
		this.markNeedsUpdate();
	}

	/**
	 * Sets the roughness.
	 * @public
	 * @param {number} roughness - Roughness value (0-1)
	 * @returns {void}
	 */
	public setRoughness(roughness: number): void {
		this.physicalMaterial.roughness = Math.max(0, Math.min(1, roughness));
		this.markNeedsUpdate();
	}

	/**
	 * Sets the normal map.
	 * @public
	 * @param {THREE.Texture} texture - Normal map texture
	 * @returns {void}
	 */
	public setNormalMap(texture: THREE.Texture): void {
		this.physicalMaterial.normalMap = texture;
		this.events.emitEvent('texture:load', { material: this, texture });
		this.markNeedsUpdate();
	}

	/**
	 * Sets the metalness map.
	 * @public
	 * @param {THREE.Texture} texture - Metalness map texture
	 * @returns {void}
	 */
	public setMetalnessMap(texture: THREE.Texture): void {
		this.physicalMaterial.metalnessMap = texture;
		this.events.emitEvent('texture:load', { material: this, texture });
		this.markNeedsUpdate();
	}

	/**
	 * Sets the roughness map.
	 * @public
	 * @param {THREE.Texture} texture - Roughness map texture
	 * @returns {void}
	 */
	public setRoughnessMap(texture: THREE.Texture): void {
		this.physicalMaterial.roughnessMap = texture;
		this.events.emitEvent('texture:load', { material: this, texture });
		this.markNeedsUpdate();
	}

	/**
	 * Sets the environment map.
	 * @public
	 * @param {THREE.CubeTexture} texture - Environment map texture
	 * @returns {void}
	 */
	public setEnvironmentMap(texture: THREE.CubeTexture): void {
		this.physicalMaterial.envMap = texture;
		this.markNeedsUpdate();
	}

	/**
	 * Sets the environment intensity.
	 * @public
	 * @param {number} intensity - Environment intensity
	 * @returns {void}
	 */
	public setEnvironmentIntensity(intensity: number): void {
		this.physicalMaterial.envMapIntensity = Math.max(0, intensity);
		this.markNeedsUpdate();
	}

	/**
	 * Sets transmission.
	 * @public
	 * @param {number} transmission - Transmission value (0-1)
	 * @returns {void}
	 */
	public setTransmission(transmission: number): void {
		this.physicalMaterial.transmission = Math.max(0, Math.min(1, transmission));
		if (transmission > 0) {
			this.physicalMaterial.transparent = true;
		}
		this.markNeedsUpdate();
	}

	/**
	 * Sets thickness.
	 * @public
	 * @param {number} thickness - Thickness value
	 * @returns {void}
	 */
	public setThickness(thickness: number): void {
		this.physicalMaterial.thickness = Math.max(0, thickness);
		this.markNeedsUpdate();
	}

	/**
	 * Sets clearcoat.
	 * @public
	 * @param {number} clearcoat - Clearcoat value (0-1)
	 * @returns {void}
	 */
	public setClearcoat(clearcoat: number): void {
		this.physicalMaterial.clearcoat = Math.max(0, Math.min(1, clearcoat));
		this.markNeedsUpdate();
	}

	/**
	 * Sets clearcoat roughness.
	 * @public
	 * @param {number} roughness - Clearcoat roughness (0-1)
	 * @returns {void}
	 */
	public setClearcoatRoughness(roughness: number): void {
		this.physicalMaterial.clearcoatRoughness = Math.max(0, Math.min(1, roughness));
		this.markNeedsUpdate();
	}

	/**
	 * Sets index of refraction.
	 * @public
	 * @param {number} ior - Index of refraction
	 * @returns {void}
	 */
	public setIOR(ior: number): void {
		this.physicalMaterial.ior = Math.max(1, ior);
		this.markNeedsUpdate();
	}

	/**
	 * Clones the material.
	 * @public
	 * @returns {PhysicalMaterial} Cloned material
	 */
	public clone(): PhysicalMaterial {
		const cloned = new PhysicalMaterial({
			color: this.physicalMaterial.color,
			metalness: this.physicalMaterial.metalness,
			roughness: this.physicalMaterial.roughness,
			transparent: this.physicalMaterial.transparent,
			opacity: this.physicalMaterial.opacity,
			side: this.physicalMaterial.side,
			map: this.physicalMaterial.map,
			normalMap: this.physicalMaterial.normalMap,
			metalnessMap: this.physicalMaterial.metalnessMap,
			roughnessMap: this.physicalMaterial.roughnessMap,
			envMap: this.physicalMaterial.envMap,
			envMapIntensity: this.physicalMaterial.envMapIntensity,
			clearcoat: this.physicalMaterial.clearcoat,
			clearcoatRoughness: this.physicalMaterial.clearcoatRoughness,
			transmission: this.physicalMaterial.transmission,
			thickness: this.physicalMaterial.thickness,
			ior: this.physicalMaterial.ior
		});
		
		return cloned;
	}
}