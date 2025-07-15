import * as THREE from 'three';
import { BasicMaterial } from '../materials/BasicMaterial';
import type { Material } from '../materials/Material';
import type { StyleSheet, ThemeConfig } from './StyleSheet';

/**
 * Centralized style compilation and management.
 * 
 * @class StyleManager
 * @memberof ui-system.styling
 */
export class StyleManager {
	/**
	 * Singleton instance.
	 * @private
	 * @static
	 */
	private static instance: StyleManager;

	/**
	 * Shader cache for compiled styles.
	 * @private
	 */
	private shaderCache: Map<string, THREE.ShaderMaterial> = new Map();

	/**
	 * Material cache for styles.
	 * @private
	 */
	private materialCache: Map<string, Material> = new Map();

	/**
	 * Current theme.
	 * @private
	 */
	private currentTheme: ThemeConfig | null = null;

	/**
	 * Private constructor for singleton.
	 * @private
	 */
	private constructor() {}

	/**
	 * Gets the singleton instance.
	 * @public
	 * @static
	 * @returns {StyleManager} The instance
	 */
	public static getInstance(): StyleManager {
		if (!StyleManager.instance) {
			StyleManager.instance = new StyleManager();
		}
		return StyleManager.instance;
	}

	/**
	 * Compiles a style into a material.
	 * @public
	 * @param {StyleSheet} style - The style to compile
	 * @returns {Material} The compiled material
	 */
	public compileStyle(style: StyleSheet): Material {
		const hash = this.hashStyle(style);
		
		// Check cache
		if (this.materialCache.has(hash)) {
			return this.materialCache.get(hash)!;
		}
		
		// Create material from style
		const material = new BasicMaterial({
			color: style.backgroundColor,
			opacity: style.backgroundOpacity ?? style.opacity ?? 1,
			transparent: (style.backgroundOpacity ?? style.opacity ?? 1) < 1,
			borderWidth: style.borderWidth,
			borderColor: style.borderColor,
			borderOpacity: style.borderOpacity,
			borderRadius: style.borderRadius
		});
		
		if (style.backgroundTexture) {
			material.setTexture(style.backgroundTexture);
		}
		
		if (style.borderStyle) {
			material.setBorderStyle(style.borderStyle);
		}
		
		// Cache the material
		this.materialCache.set(hash, material);
		
		return material;
	}

	/**
	 * Clears the cache.
	 * @public
	 * @returns {void}
	 */
	public clearCache(): void {
		// Dispose cached shaders
		this.shaderCache.forEach(shader => shader.dispose());
		this.shaderCache.clear();
		
		// Dispose cached materials
		this.materialCache.forEach(material => material.dispose());
		this.materialCache.clear();
	}

	/**
	 * Gets the cache size.
	 * @public
	 * @returns {number} Number of cached items
	 */
	public getCacheSize(): number {
		return this.shaderCache.size + this.materialCache.size;
	}

	/**
	 * Sets the theme.
	 * @public
	 * @param {ThemeConfig} theme - The theme to set
	 * @returns {void}
	 */
	public setTheme(theme: ThemeConfig): void {
		this.currentTheme = theme;
		// Clear cache when theme changes
		this.clearCache();
	}

	/**
	 * Gets the current theme.
	 * @public
	 * @returns {ThemeConfig | null} The current theme
	 */
	public getTheme(): ThemeConfig | null {
		return this.currentTheme;
	}

	/**
	 * Hashes a style for caching.
	 * @private
	 * @param {StyleSheet} style - The style to hash
	 * @returns {string} Hash string
	 */
	private hashStyle(style: StyleSheet): string {
		const parts = [];
		
		// Hash fill properties
		if (style.backgroundColor) {
			const color = style.backgroundColor instanceof THREE.Color 
				? style.backgroundColor.getHexString() 
				: style.backgroundColor;
			parts.push(`bg:${color}`);
		}
		parts.push(`bgo:${style.backgroundOpacity ?? 1}`);
		
		// Hash border properties
		if (style.borderWidth) {
			parts.push(`bw:${style.borderWidth}`);
		}
		if (style.borderColor) {
			const color = style.borderColor instanceof THREE.Color 
				? style.borderColor.getHexString() 
				: style.borderColor;
			parts.push(`bc:${color}`);
		}
		parts.push(`bo:${style.borderOpacity ?? 1}`);
		parts.push(`bs:${style.borderStyle ?? 'solid'}`);
		parts.push(`br:${style.borderRadius ?? 0}`);
		
		// Hash other properties
		parts.push(`o:${style.opacity ?? 1}`);
		parts.push(`v:${style.visible ?? true}`);
		
		return parts.join('|');
	}

	/**
	 * Creates a shader from style.
	 * @private
	 * @param {StyleSheet} style - The style
	 * @returns {THREE.ShaderMaterial} The shader material
	 */
	private createShaderFromStyle(style: StyleSheet): THREE.ShaderMaterial {
		const uniforms = this.generateUniforms(style);
		
		return new THREE.ShaderMaterial({
			uniforms,
			vertexShader: this.generateVertexShader(),
			fragmentShader: this.generateFragmentShader(style),
			transparent: true,
			side: THREE.DoubleSide
		});
	}

	/**
	 * Generates fragment shader.
	 * @private
	 * @param {StyleSheet} style - The style
	 * @returns {string} Fragment shader code
	 */
	private generateFragmentShader(style: StyleSheet): string {
		let shader = `
			uniform vec3 backgroundColor;
			uniform float backgroundOpacity;
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
		`;
		
		if (style.borderStyle === 'dashed') {
			shader += `
				float dashPattern(float coord, float dashSize, float gapSize) {
					float total = dashSize + gapSize;
					return step(dashSize, mod(coord, total));
				}
			`;
		}
		
		shader += `
			void main() {
				vec2 uv = vUv - 0.5;
				vec2 halfSize = size * 0.5;
				
				float dist = sdRoundedBox(uv * size, halfSize, borderRadius);
				
				vec4 color = vec4(backgroundColor, backgroundOpacity);
		`;
		
		if (style.borderWidth && style.borderWidth > 0) {
			shader += `
				float borderAlpha = 0.0;
				float borderDist = abs(dist) - borderWidth * 0.5;
				borderAlpha = 1.0 - smoothstep(-0.5, 0.5, borderDist);
			`;
			
			if (style.borderStyle === 'dashed') {
				shader += `
					float dash = dashPattern(length(uv * size), 5.0, 5.0);
					borderAlpha *= (1.0 - dash);
				`;
			}
			
			shader += `
				color = mix(color, vec4(borderColor, borderOpacity), borderAlpha);
			`;
		}
		
		shader += `
				float alpha = 1.0 - smoothstep(-0.5, 0.5, dist);
				color.a *= alpha;
				
				gl_FragColor = color;
			}
		`;
		
		return shader;
	}

	/**
	 * Generates vertex shader.
	 * @private
	 * @returns {string} Vertex shader code
	 */
	private generateVertexShader(): string {
		return `
			varying vec2 vUv;
			
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`;
	}

	/**
	 * Generates uniforms from style.
	 * @private
	 * @param {StyleSheet} style - The style
	 * @returns {{ [uniform: string]: THREE.IUniform }} Uniforms
	 */
	private generateUniforms(style: StyleSheet): { [uniform: string]: THREE.IUniform } {
		const backgroundColor = style.backgroundColor instanceof THREE.Color
			? style.backgroundColor
			: new THREE.Color(style.backgroundColor || 0xffffff);
			
		const borderColor = style.borderColor instanceof THREE.Color
			? style.borderColor
			: new THREE.Color(style.borderColor || 0x000000);
		
		return {
			backgroundColor: { value: backgroundColor },
			backgroundOpacity: { value: style.backgroundOpacity ?? 1 },
			borderWidth: { value: style.borderWidth ?? 0 },
			borderColor: { value: borderColor },
			borderOpacity: { value: style.borderOpacity ?? 1 },
			borderRadius: { value: style.borderRadius ?? 0 },
			size: { value: new THREE.Vector2(100, 100) }
		};
	}
}