import * as THREE from 'three';
import { EventEmitter } from '@core/event-emitter';

/**
 * Event map for Material events.
 * @interface MaterialEventMap
 * @memberof ui-system.materials
 */
export interface MaterialEventMap {
	'update': { material: Material };
	'shader:upgrade': { material: Material; fromType: string; toType: string };
	'texture:load': { material: Material; texture: THREE.Texture };
	'texture:error': { material: Material; error: Error };
}

/**
 * Material options interface.
 * @interface MaterialOptions
 * @memberof ui-system.materials
 */
export interface MaterialOptions {
	transparent?: boolean;
	opacity?: number;
	side?: THREE.Side;
	depthWrite?: boolean;
	depthTest?: boolean;
}

/**
 * Abstract base class that wraps Three.js materials.
 * 
 * @abstract
 * @class Material
 * @memberof ui-system.materials
 */
export abstract class Material {
	/**
	 * Event emitter for material events.
	 * @public
	 * @readonly
	 */
	public readonly events = new EventEmitter<MaterialEventMap>();

	/**
	 * Underlying Three.js material.
	 * @protected
	 */
	protected _threeMaterial: THREE.Material;

	/**
	 * Update needed flag.
	 * @protected
	 */
	protected _needsUpdate: boolean = false;

	/**
	 * Custom uniforms for shader materials.
	 * @protected
	 */
	protected _uniforms: { [uniform: string]: THREE.IUniform } = {};

	/**
	 * Creates a new Material instance.
	 * @public
	 * @param {MaterialOptions} [options={}] - Material options
	 */
	public constructor(options: MaterialOptions = {}) {
		// Subclasses will initialize _threeMaterial
		this._threeMaterial = null as any;
	}

	/**
	 * Gets the Three.js material.
	 * @public
	 * @returns {THREE.Material} The Three.js material
	 */
	public get threeMaterial(): THREE.Material {
		return this._threeMaterial;
	}

	/**
	 * Sets the color.
	 * @public
	 * @abstract
	 * @param {string | number | THREE.Color} color - The color
	 * @returns {void}
	 */
	public abstract setColor(color: string | number | THREE.Color): void;

	/**
	 * Sets the opacity.
	 * @public
	 * @abstract
	 * @param {number} opacity - The opacity (0-1)
	 * @returns {void}
	 */
	public abstract setOpacity(opacity: number): void;

	/**
	 * Sets the texture.
	 * @public
	 * @abstract
	 * @param {THREE.Texture | null} texture - The texture
	 * @returns {void}
	 */
	public abstract setTexture(texture: THREE.Texture | null): void;

	/**
	 * Sets a uniform value.
	 * @public
	 * @param {string} name - Uniform name
	 * @param {any} value - Uniform value
	 * @returns {void}
	 */
	public setUniform(name: string, value: any): void {
		if (this._threeMaterial instanceof THREE.ShaderMaterial) {
			if (!this._threeMaterial.uniforms[name]) {
				this._threeMaterial.uniforms[name] = { value };
			} else {
				this._threeMaterial.uniforms[name].value = value;
			}
			this._uniforms[name] = this._threeMaterial.uniforms[name];
		} else {
			// Store for later upgrade to shader material
			this._uniforms[name] = { value };
		}
		this.markNeedsUpdate();
	}

	/**
	 * Gets a uniform value.
	 * @public
	 * @param {string} name - Uniform name
	 * @returns {any} Uniform value
	 */
	public getUniform(name: string): any {
		if (this._uniforms[name]) {
			return this._uniforms[name].value;
		}
		return undefined;
	}

	/**
	 * Upgrades to shader material.
	 * @protected
	 * @returns {void}
	 */
	protected upgradeToShaderMaterial(): void {
		const fromType = this._threeMaterial.type;
		
		// Create shader material with basic shaders
		const shaderMaterial = new THREE.ShaderMaterial({
			uniforms: {
				...this._uniforms,
				map: { value: null },
				opacity: { value: this._threeMaterial.opacity },
				color: { value: new THREE.Color(0xffffff) }
			},
			vertexShader: this.getDefaultVertexShader(),
			fragmentShader: this.getDefaultFragmentShader(),
			transparent: this._threeMaterial.transparent,
			side: this._threeMaterial.side,
			depthWrite: this._threeMaterial.depthWrite,
			depthTest: this._threeMaterial.depthTest
		});
		
		// Copy properties
		if ('color' in this._threeMaterial) {
			shaderMaterial.uniforms.color.value = (this._threeMaterial as any).color.clone();
		}
		if ('map' in this._threeMaterial) {
			shaderMaterial.uniforms.map.value = (this._threeMaterial as any).map;
		}
		
		// Replace material
		this._threeMaterial.dispose();
		this._threeMaterial = shaderMaterial;
		
		this.events.emitEvent('shader:upgrade', { 
			material: this, 
			fromType, 
			toType: 'ShaderMaterial' 
		});
	}

	/**
	 * Marks material as needing update.
	 * @public
	 * @returns {void}
	 */
	public markNeedsUpdate(): void {
		this._needsUpdate = true;
		this._threeMaterial.needsUpdate = true;
	}

	/**
	 * Updates the material.
	 * @public
	 * @returns {void}
	 */
	public update(): void {
		if (!this._needsUpdate) return;
		
		this.events.emitEvent('update', { material: this });
		this._needsUpdate = false;
	}

	/**
	 * Checks if material is transparent.
	 * @public
	 * @returns {boolean} True if transparent
	 */
	public isTransparent(): boolean {
		return this._threeMaterial.transparent;
	}

	/**
	 * Checks if material needs update.
	 * @public
	 * @returns {boolean} True if needs update
	 */
	public needsUpdate(): boolean {
		return this._needsUpdate;
	}

	/**
	 * Gets default vertex shader.
	 * @protected
	 * @returns {string} Vertex shader code
	 */
	protected getDefaultVertexShader(): string {
		return `
			varying vec2 vUv;
			
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`;
	}

	/**
	 * Gets default fragment shader.
	 * @protected
	 * @returns {string} Fragment shader code
	 */
	protected getDefaultFragmentShader(): string {
		return `
			uniform vec3 color;
			uniform float opacity;
			uniform sampler2D map;
			
			varying vec2 vUv;
			
			void main() {
				vec4 texColor = texture2D(map, vUv);
				gl_FragColor = vec4(color * texColor.rgb, opacity * texColor.a);
			}
		`;
	}

	/**
	 * Disposes of material resources.
	 * @public
	 * @returns {void}
	 */
	public dispose(): void {
		this._threeMaterial.dispose();
		this.events.dispose();
	}
}