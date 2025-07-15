import * as THREE from 'three';
import { Material, type MaterialOptions } from './Material';

/**
 * Basic material options.
 * @interface BasicMaterialOptions
 * @extends MaterialOptions
 * @memberof ui-system.materials
 */
export interface BasicMaterialOptions extends MaterialOptions {
	color?: string | number | THREE.Color;
	map?: THREE.Texture;
	borderWidth?: number;
	borderColor?: string | number | THREE.Color;
	borderOpacity?: number;
	borderRadius?: number;
}

/**
 * Gradient configuration.
 * @interface GradientConfig
 * @memberof ui-system.materials
 */
export interface GradientConfig {
	type: 'linear' | 'radial';
	stops: Array<{ offset: number; color: string | THREE.Color }>;
	angle?: number;
	center?: THREE.Vector2;
}

/**
 * Standard material for most UI elements with support for fills and borders.
 * 
 * @class BasicMaterial
 * @extends Material
 * @memberof ui-system.materials
 */
export class BasicMaterial extends Material {
	/**
	 * Fill color.
	 * @private
	 */
	private fillColor: THREE.Color;

	/**
	 * Fill opacity.
	 * @private
	 */
	private fillOpacity: number = 1;

	/**
	 * Fill texture.
	 * @private
	 */
	private fillTexture: THREE.Texture | null = null;

	/**
	 * Border width.
	 * @private
	 */
	private borderWidth: number = 0;

	/**
	 * Border color.
	 * @private
	 */
	private borderColor: THREE.Color;

	/**
	 * Border opacity.
	 * @private
	 */
	private borderOpacity: number = 1;

	/**
	 * Border style.
	 * @private
	 */
	private borderStyle: 'solid' | 'dashed' | 'dotted' = 'solid';

	/**
	 * Border radius.
	 * @private
	 */
	private borderRadius: number = 0;

	/**
	 * Gradient configuration.
	 * @private
	 */
	private gradient: GradientConfig | null = null;

	/**
	 * Creates a new BasicMaterial instance.
	 * @public
	 * @param {BasicMaterialOptions} [options={}] - Material options
	 */
	public constructor(options: BasicMaterialOptions = {}) {
		super(options);
		
		this.fillColor = new THREE.Color(options.color || 0xffffff);
		this.borderColor = new THREE.Color(options.borderColor || 0x000000);
		
		if (options.borderWidth !== undefined) {
			this.borderWidth = options.borderWidth;
		}
		if (options.borderOpacity !== undefined) {
			this.borderOpacity = options.borderOpacity;
		}
		if (options.borderRadius !== undefined) {
			this.borderRadius = options.borderRadius;
		}
		
		// Create basic material
		this._threeMaterial = new THREE.MeshBasicMaterial({
			color: this.fillColor,
			transparent: options.transparent ?? true,
			opacity: options.opacity ?? 1,
			side: options.side ?? THREE.DoubleSide,
			depthWrite: options.depthWrite ?? true,
			depthTest: options.depthTest ?? true,
			map: options.map || null
		});
		
		if (options.map) {
			this.fillTexture = options.map;
		}
		
		// Upgrade to shader material if we have borders or rounded corners
		if (this.borderWidth > 0 || this.borderRadius > 0) {
			this.upgradeToShaderMaterial();
		}
	}

	/**
	 * Sets the color.
	 * @public
	 * @override
	 * @param {string | number | THREE.Color} color - The color
	 * @returns {void}
	 */
	public setColor(color: string | number | THREE.Color): void {
		this.setFillColor(color);
	}

	/**
	 * Sets the opacity.
	 * @public
	 * @override
	 * @param {number} opacity - The opacity
	 * @returns {void}
	 */
	public setOpacity(opacity: number): void {
		this.setFillOpacity(opacity);
	}

	/**
	 * Sets the texture.
	 * @public
	 * @override
	 * @param {THREE.Texture | null} texture - The texture
	 * @returns {void}
	 */
	public setTexture(texture: THREE.Texture | null): void {
		this.setFillTexture(texture);
	}

	/**
	 * Sets the fill color.
	 * @public
	 * @param {string | number | THREE.Color} color - The color
	 * @returns {void}
	 */
	public setFillColor(color: string | number | THREE.Color): void {
		this.fillColor.set(color as any);
		if (this._threeMaterial instanceof THREE.MeshBasicMaterial) {
			this._threeMaterial.color = this.fillColor;
		}
		this.markNeedsUpdate();
	}

	/**
	 * Sets the fill opacity.
	 * @public
	 * @param {number} opacity - The opacity
	 * @returns {void}
	 */
	public setFillOpacity(opacity: number): void {
		this.fillOpacity = Math.max(0, Math.min(1, opacity));
		this._threeMaterial.opacity = this.fillOpacity;
		this.markNeedsUpdate();
	}

	/**
	 * Sets the fill texture.
	 * @public
	 * @param {THREE.Texture | null} texture - The texture
	 * @returns {void}
	 */
	public setFillTexture(texture: THREE.Texture | null): void {
		this.fillTexture = texture;
		if (this._threeMaterial instanceof THREE.MeshBasicMaterial) {
			this._threeMaterial.map = texture;
		}
		
		if (texture) {
			this.events.emitEvent('texture:load', { material: this, texture });
		}
		
		this.markNeedsUpdate();
	}

	/**
	 * Sets the border width.
	 * @public
	 * @param {number} width - Border width
	 * @returns {void}
	 */
	public setBorderWidth(width: number): void {
		this.borderWidth = Math.max(0, width);
		if (this.borderWidth > 0 && !(this._threeMaterial instanceof THREE.ShaderMaterial)) {
			this.upgradeToShaderMaterial();
		}
		this.markNeedsUpdate();
	}

	/**
	 * Sets the border color.
	 * @public
	 * @param {string | number | THREE.Color} color - Border color
	 * @returns {void}
	 */
	public setBorderColor(color: string | number | THREE.Color): void {
		this.borderColor.set(color as any);
		if (this.borderWidth > 0 && !(this._threeMaterial instanceof THREE.ShaderMaterial)) {
			this.upgradeToShaderMaterial();
		}
		this.markNeedsUpdate();
	}

	/**
	 * Sets the border opacity.
	 * @public
	 * @param {number} opacity - Border opacity
	 * @returns {void}
	 */
	public setBorderOpacity(opacity: number): void {
		this.borderOpacity = Math.max(0, Math.min(1, opacity));
		this.markNeedsUpdate();
	}

	/**
	 * Sets the border style.
	 * @public
	 * @param {('solid' | 'dashed' | 'dotted')} style - Border style
	 * @returns {void}
	 */
	public setBorderStyle(style: 'solid' | 'dashed' | 'dotted'): void {
		this.borderStyle = style;
		if (this.borderWidth > 0 && !(this._threeMaterial instanceof THREE.ShaderMaterial)) {
			this.upgradeToShaderMaterial();
		}
		this.markNeedsUpdate();
	}

	/**
	 * Sets the border radius.
	 * @public
	 * @param {number} radius - Border radius
	 * @returns {void}
	 */
	public setBorderRadius(radius: number): void {
		this.borderRadius = Math.max(0, radius);
		if (this.borderRadius > 0 && !(this._threeMaterial instanceof THREE.ShaderMaterial)) {
			this.upgradeToShaderMaterial();
		}
		this.markNeedsUpdate();
	}

	/**
	 * Sets a gradient.
	 * @public
	 * @param {GradientConfig} gradient - Gradient configuration
	 * @returns {void}
	 */
	public setGradient(gradient: GradientConfig): void {
		this.gradient = gradient;
		if (!(this._threeMaterial instanceof THREE.ShaderMaterial)) {
			this.upgradeToShaderMaterial();
		}
		this.markNeedsUpdate();
	}

	/**
	 * Clones the material.
	 * @public
	 * @returns {BasicMaterial} Cloned material
	 */
	public clone(): BasicMaterial {
		const cloned = new BasicMaterial({
			color: this.fillColor,
			opacity: this.fillOpacity,
			transparent: this._threeMaterial.transparent,
			side: this._threeMaterial.side,
			borderWidth: this.borderWidth,
			borderColor: this.borderColor,
			borderOpacity: this.borderOpacity,
			borderRadius: this.borderRadius
		});
		
		if (this.fillTexture) {
			cloned.setFillTexture(this.fillTexture);
		}
		
		if (this.gradient) {
			cloned.setGradient(this.gradient);
		}
		
		cloned.setBorderStyle(this.borderStyle);
		
		return cloned;
	}

	/**
	 * Gets custom fragment shader for advanced features.
	 * @protected
	 * @override
	 * @returns {string} Fragment shader code
	 */
	protected getDefaultFragmentShader(): string {
		return `
			uniform vec3 color;
			uniform float opacity;
			uniform sampler2D map;
			uniform bool hasMap;
			uniform float borderWidth;
			uniform vec3 borderColor;
			uniform float borderOpacity;
			uniform float borderRadius;
			uniform vec2 size;
			
			varying vec2 vUv;
			
			float sdRoundedBox(vec2 p, vec2 b, float r) {
				vec2 d = abs(p) - b + r;
				return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
			}
			
			void main() {
				vec2 uv = vUv - 0.5;
				vec2 halfSize = size * 0.5;
				
				// Calculate distance to rounded box edge
				float dist = sdRoundedBox(uv * size, halfSize, borderRadius);
				
				// Fill
				vec4 fillColor = vec4(color, opacity);
				if (hasMap) {
					fillColor *= texture2D(map, vUv);
				}
				
				// Border
				float borderAlpha = 0.0;
				if (borderWidth > 0.0) {
					float borderDist = abs(dist) - borderWidth * 0.5;
					borderAlpha = 1.0 - smoothstep(-0.5, 0.5, borderDist);
				}
				
				// Combine fill and border
				vec4 finalColor = mix(fillColor, vec4(borderColor, borderOpacity), borderAlpha);
				
				// Apply rounded corners
				float alpha = 1.0 - smoothstep(-0.5, 0.5, dist);
				finalColor.a *= alpha;
				
				gl_FragColor = finalColor;
			}
		`;
	}

	/**
	 * Upgrades to shader material.
	 * @protected
	 * @override
	 * @returns {void}
	 */
	protected upgradeToShaderMaterial(): void {
		const uniforms = {
			...this._uniforms,
			color: { value: this.fillColor },
			opacity: { value: this.fillOpacity },
			map: { value: this.fillTexture || new THREE.Texture() },
			hasMap: { value: this.fillTexture !== null },
			borderWidth: { value: this.borderWidth },
			borderColor: { value: this.borderColor },
			borderOpacity: { value: this.borderOpacity },
			borderRadius: { value: this.borderRadius },
			size: { value: new THREE.Vector2(100, 100) } // Will be set by sprite
		};
		
		const fromType = this._threeMaterial.type;
		
		this._threeMaterial.dispose();
		this._threeMaterial = new THREE.ShaderMaterial({
			uniforms,
			vertexShader: this.getDefaultVertexShader(),
			fragmentShader: this.getDefaultFragmentShader(),
			transparent: true,
			side: THREE.DoubleSide
		});
		
		this.events.emitEvent('shader:upgrade', { 
			material: this, 
			fromType, 
			toType: 'ShaderMaterial' 
		});
	}
}