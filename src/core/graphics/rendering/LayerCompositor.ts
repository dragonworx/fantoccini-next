/**
 * Layer compositor for combining multiple layers into final output.
 * 
 * @namespace core.graphics
 * @memberof core
 */

import type { Layer } from '../views/Layer.js';
import type { LayerCompositorOptions } from '../types/RenderTypes.js';

/**
 * Composites multiple layers into a single output canvas.
 * Handles blending, opacity, and layer transformations.
 */
export class LayerCompositor {
	private outputCanvas: HTMLCanvasElement;
	private outputContext: CanvasRenderingContext2D;
	private options: LayerCompositorOptions;

	// Performance tracking
	private compositeCount: number = 0;
	private totalCompositeTime: number = 0;

	constructor(outputCanvas: HTMLCanvasElement, options: LayerCompositorOptions = {}) {
		this.outputCanvas = outputCanvas;
		this.outputContext = outputCanvas.getContext('2d', {
			alpha: true,
			desynchronized: true
		})!;

		this.options = {
			enableBlending: true,
			enableFilters: true,
			maxLayers: 50,
			...options
		};
	}

	/**
	 * Composites an array of layers into the output canvas.
	 */
	public composite(layers: Layer[]): void {
		const startTime = performance.now();

		// Clear output canvas
		this.clearOutput();

		// Filter and validate layers
		const validLayers = this.filterValidLayers(layers);

		if (validLayers.length === 0) {
			return;
		}

		// Composite layers in order
		for (const layer of validLayers) {
			this.compositeLayer(layer);
		}

		// Update performance metrics
		this.compositeCount++;
		this.totalCompositeTime += performance.now() - startTime;
	}

	/**
	 * Composites a single layer onto the output canvas.
	 */
	public compositeLayer(layer: Layer): void {
		if (!layer.visible || layer.opacity <= 0) {
			return;
		}

		this.outputContext.save();

		// Apply layer opacity
		if (layer.opacity < 1) {
			this.outputContext.globalAlpha = layer.opacity;
		}

		// Apply layer blend mode
		if (this.options.enableBlending && layer.blendMode !== 'source-over') {
			this.outputContext.globalCompositeOperation = layer.blendMode;
		}

		// Apply layer offset
		if (layer.offset.x !== 0 || layer.offset.y !== 0) {
			this.outputContext.translate(layer.offset.x, layer.offset.y);
		}

		// Draw layer canvas
		this.outputContext.drawImage(layer.canvas, 0, 0);

		this.outputContext.restore();
	}

	/**
	 * Composites layers with advanced blending and effects.
	 */
	public compositeAdvanced(layers: Layer[], effects?: CompositeEffect[]): void {
		const startTime = performance.now();

		this.clearOutput();
		const validLayers = this.filterValidLayers(layers);

		if (validLayers.length === 0) {
			return;
		}

		// Apply pre-composite effects
		if (effects) {
			this.applyPreCompositeEffects(effects);
		}

		// Group layers by blend mode for optimization
		const layerGroups = this.groupLayersByBlendMode(validLayers);

		for (const group of layerGroups) {
			this.compositeLayerGroup(group);
		}

		// Apply post-composite effects
		if (effects) {
			this.applyPostCompositeEffects(effects);
		}

		this.compositeCount++;
		this.totalCompositeTime += performance.now() - startTime;
	}

	/**
	 * Clears the output canvas.
	 */
	public clearOutput(): void {
		this.outputContext.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
	}

	/**
	 * Sets the output canvas size.
	 */
	public resize(width: number, height: number): void {
		const pixelRatio = window.devicePixelRatio || 1;
		
		this.outputCanvas.width = width * pixelRatio;
		this.outputCanvas.height = height * pixelRatio;
		this.outputCanvas.style.width = `${width}px`;
		this.outputCanvas.style.height = `${height}px`;
		
		this.outputContext.scale(pixelRatio, pixelRatio);
	}

	/**
	 * Gets performance metrics.
	 */
	public getPerformanceMetrics(): {
		averageCompositeTime: number;
		compositeCount: number;
		totalCompositeTime: number;
	} {
		return {
			averageCompositeTime: this.compositeCount > 0 ? this.totalCompositeTime / this.compositeCount : 0,
			compositeCount: this.compositeCount,
			totalCompositeTime: this.totalCompositeTime
		};
	}

	/**
	 * Resets performance metrics.
	 */
	public resetPerformanceMetrics(): void {
		this.compositeCount = 0;
		this.totalCompositeTime = 0;
	}

	// Private Helper Methods
	private filterValidLayers(layers: Layer[]): Layer[] {
		return layers
			.filter(layer => layer.visible && layer.opacity > 0)
			.slice(0, this.options.maxLayers || 50);
	}

	private groupLayersByBlendMode(layers: Layer[]): LayerGroup[] {
		const groups: LayerGroup[] = [];
		let currentGroup: LayerGroup | null = null;

		for (const layer of layers) {
			if (!currentGroup || currentGroup.blendMode !== layer.blendMode) {
				currentGroup = {
					blendMode: layer.blendMode,
					layers: [layer]
				};
				groups.push(currentGroup);
			} else {
				currentGroup.layers.push(layer);
			}
		}

		return groups;
	}

	private compositeLayerGroup(group: LayerGroup): void {
		if (group.layers.length === 0) return;

		this.outputContext.save();

		// Set blend mode for the entire group
		if (this.options.enableBlending && group.blendMode !== 'source-over') {
			this.outputContext.globalCompositeOperation = group.blendMode;
		}

		// Composite each layer in the group
		for (const layer of group.layers) {
			this.outputContext.save();

			// Apply layer-specific properties
			if (layer.opacity < 1) {
				this.outputContext.globalAlpha = layer.opacity;
			}

			if (layer.offset.x !== 0 || layer.offset.y !== 0) {
				this.outputContext.translate(layer.offset.x, layer.offset.y);
			}

			this.outputContext.drawImage(layer.canvas, 0, 0);
			this.outputContext.restore();
		}

		this.outputContext.restore();
	}

	private applyPreCompositeEffects(effects: CompositeEffect[]): void {
		const preEffects = effects.filter(effect => effect.stage === 'pre');
		this.applyEffects(preEffects);
	}

	private applyPostCompositeEffects(effects: CompositeEffect[]): void {
		const postEffects = effects.filter(effect => effect.stage === 'post');
		this.applyEffects(postEffects);
	}

	private applyEffects(effects: CompositeEffect[]): void {
		if (!this.options.enableFilters) return;

		for (const effect of effects) {
			switch (effect.type) {
				case 'blur':
					this.outputContext.filter = `blur(${effect.value}px)`;
					break;
				case 'brightness':
					this.outputContext.filter = `brightness(${effect.value}%)`;
					break;
				case 'contrast':
					this.outputContext.filter = `contrast(${effect.value}%)`;
					break;
				case 'saturate':
					this.outputContext.filter = `saturate(${effect.value}%)`;
					break;
				case 'hue-rotate':
					this.outputContext.filter = `hue-rotate(${effect.value}deg)`;
					break;
				case 'custom':
					if (effect.filterString) {
						this.outputContext.filter = effect.filterString;
					}
					break;
			}

			// Apply the filter by drawing the canvas onto itself
			if (this.outputContext.filter !== 'none') {
				const imageData = this.outputContext.getImageData(0, 0, this.outputCanvas.width, this.outputCanvas.height);
				this.outputContext.putImageData(imageData, 0, 0);
				this.outputContext.filter = 'none';
			}
		}
	}
}

// Supporting types
interface LayerGroup {
	blendMode: GlobalCompositeOperation;
	layers: Layer[];
}

export interface CompositeEffect {
	type: 'blur' | 'brightness' | 'contrast' | 'saturate' | 'hue-rotate' | 'custom';
	value: number;
	stage: 'pre' | 'post';
	filterString?: string; // For custom effects
}

/**
 * Advanced layer compositor with support for complex blending and effects.
 */
export class AdvancedLayerCompositor extends LayerCompositor {
	private temporaryCanvas: HTMLCanvasElement;
	private temporaryContext: CanvasRenderingContext2D;

	constructor(outputCanvas: HTMLCanvasElement, options: LayerCompositorOptions = {}) {
		super(outputCanvas, options);

		// Create temporary canvas for advanced operations
		this.temporaryCanvas = document.createElement('canvas');
		this.temporaryContext = this.temporaryCanvas.getContext('2d')!;
		this.resizeTemporaryCanvas();
	}

	/**
	 * Composites layers with mask support.
	 */
	public compositeWithMasks(layers: Layer[], masks: Layer[]): void {
		this.clearOutput();

		for (let i = 0; i < layers.length; i++) {
			const layer = layers[i];
			const mask = masks[i];

			if (!layer.visible || layer.opacity <= 0) continue;

			if (mask && mask.visible) {
				this.compositeLayerWithMask(layer, mask);
			} else {
				this.compositeLayer(layer);
			}
		}
	}

	/**
	 * Composites a layer with a mask applied.
	 */
	private compositeLayerWithMask(layer: Layer, mask: Layer): void {
		// Clear temporary canvas
		this.temporaryContext.clearRect(0, 0, this.temporaryCanvas.width, this.temporaryCanvas.height);

		// Draw mask to temporary canvas
		this.temporaryContext.drawImage(mask.canvas, 0, 0);

		// Set composite operation to use mask as alpha
		this.temporaryContext.globalCompositeOperation = 'source-in';

		// Draw layer with mask applied
		this.temporaryContext.drawImage(layer.canvas, 0, 0);

		// Reset composite operation
		this.temporaryContext.globalCompositeOperation = 'source-over';

		// Composite result to output
		const outputContext = (this as any).outputContext;
		outputContext.save();

		if (layer.opacity < 1) {
			outputContext.globalAlpha = layer.opacity;
		}

		if (layer.offset.x !== 0 || layer.offset.y !== 0) {
			outputContext.translate(layer.offset.x, layer.offset.y);
		}

		outputContext.drawImage(this.temporaryCanvas, 0, 0);
		outputContext.restore();
	}

	private resizeTemporaryCanvas(): void {
		const outputCanvas = (this as any).outputCanvas;
		this.temporaryCanvas.width = outputCanvas.width;
		this.temporaryCanvas.height = outputCanvas.height;
	}

	public resize(width: number, height: number): void {
		super.resize(width, height);
		this.resizeTemporaryCanvas();
	}
}