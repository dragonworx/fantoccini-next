/**
 * Layer implementation for composited rendering.
 * 
 * @namespace core.graphics
 * @memberof core
 */

import type { Point, Viewport, LayerOptions } from '../types/GraphicsTypes.js';
import type { LayerData } from '../types/RenderTypes.js';
import type { BaseElement } from '../elements/BaseElement.js';

let layerIdCounter = 0;

/**
 * A rendering layer that manages its own canvas and elements.
 * Layers are composited together to create the final rendered output.
 */
export class Layer implements LayerData {
	public readonly id: string;
	public readonly canvas: HTMLCanvasElement;
	public readonly context: CanvasRenderingContext2D;
	public readonly elements: Set<BaseElement>;

	// Layer Properties
	public visible: boolean;
	public opacity: number;
	public offset: Point;
	public blendMode: GlobalCompositeOperation;

	// State
	public dirty: boolean;
	public lastRenderTime: number;

	// Performance tracking
	private renderCount: number = 0;
	private totalRenderTime: number = 0;

	constructor(width: number, height: number, options: LayerOptions = {}) {
		this.id = `layer-${layerIdCounter++}`;
		this.elements = new Set();

		// Create canvas
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d', {
			alpha: true,
			desynchronized: true // Performance hint
		})!;

		// Initialize properties
		this.visible = options.visible !== undefined ? options.visible : true;
		this.opacity = options.opacity !== undefined ? options.opacity : 1;
		this.offset = options.offset || { x: 0, y: 0 };
		this.blendMode = options.blendMode || 'source-over';

		// State
		this.dirty = true;
		this.lastRenderTime = 0;

		// Set initial size
		this.resize(width, height);
	}

	// Element Management
	public addElement(element: BaseElement): void {
		if (!this.elements.has(element)) {
			this.elements.add(element);
			this.invalidate();
		}
	}

	public removeElement(element: BaseElement): void {
		if (this.elements.has(element)) {
			this.elements.delete(element);
			this.invalidate();
		}
	}

	public hasElement(element: BaseElement): boolean {
		return this.elements.has(element);
	}

	public getElementCount(): number {
		return this.elements.size;
	}

	public getElements(): BaseElement[] {
		return Array.from(this.elements);
	}

	// Rendering
	public render(viewport?: Viewport): void {
		if (!this.visible || this.opacity <= 0 || this.elements.size === 0) {
			return;
		}

		const startTime = performance.now();

		// Clear the layer
		this.clear();

		// Set up context state
		this.context.save();
		this.context.globalAlpha = this.opacity;
		this.context.globalCompositeOperation = this.blendMode;

		// Apply layer offset
		if (this.offset.x !== 0 || this.offset.y !== 0) {
			this.context.translate(this.offset.x, this.offset.y);
		}

		// Apply viewport clipping if provided
		if (viewport) {
			this.context.beginPath();
			this.context.rect(viewport.x, viewport.y, viewport.width, viewport.height);
			this.context.clip();
		}

		// Render elements in z-order
		const sortedElements = this.getSortedElements();
		let elementsRendered = 0;

		for (const element of sortedElements) {
			if (this.shouldRenderElement(element, viewport)) {
				element.render(this.context);
				elementsRendered++;
			}
		}

		this.context.restore();

		// Update state
		this.dirty = false;
		this.lastRenderTime = performance.now() - startTime;
		this.renderCount++;
		this.totalRenderTime += this.lastRenderTime;
	}

	public clear(): void {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	public invalidate(): void {
		this.dirty = true;
	}

	// Layer Properties
	public setVisible(visible: boolean): void {
		if (this.visible !== visible) {
			this.visible = visible;
			this.invalidate();
		}
	}

	public setOpacity(opacity: number): void {
		const clampedOpacity = Math.max(0, Math.min(1, opacity));
		if (this.opacity !== clampedOpacity) {
			this.opacity = clampedOpacity;
			this.invalidate();
		}
	}

	public setOffset(offset: Point): void {
		if (this.offset.x !== offset.x || this.offset.y !== offset.y) {
			this.offset = { ...offset };
			this.invalidate();
		}
	}

	public setBlendMode(blendMode: GlobalCompositeOperation): void {
		if (this.blendMode !== blendMode) {
			this.blendMode = blendMode;
			this.invalidate();
		}
	}

	// Canvas Management
	public resize(width: number, height: number): void {
		const pixelRatio = window.devicePixelRatio || 1;
		const canvasWidth = width * pixelRatio;
		const canvasHeight = height * pixelRatio;

		if (this.canvas.width !== canvasWidth || this.canvas.height !== canvasHeight) {
			this.canvas.width = canvasWidth;
			this.canvas.height = canvasHeight;
			this.canvas.style.width = `${width}px`;
			this.canvas.style.height = `${height}px`;

			// Scale context to handle pixel ratio
			this.context.scale(pixelRatio, pixelRatio);

			this.invalidate();
		}
	}

	public getSize(): { width: number; height: number } {
		const pixelRatio = window.devicePixelRatio || 1;
		return {
			width: this.canvas.width / pixelRatio,
			height: this.canvas.height / pixelRatio
		};
	}

	// Performance Metrics
	public getAverageRenderTime(): number {
		return this.renderCount > 0 ? this.totalRenderTime / this.renderCount : 0;
	}

	public getRenderCount(): number {
		return this.renderCount;
	}

	public resetPerformanceMetrics(): void {
		this.renderCount = 0;
		this.totalRenderTime = 0;
	}

	// Image Export
	public toDataURL(type?: string, quality?: any): string {
		return this.canvas.toDataURL(type, quality);
	}

	public toBlob(callback: BlobCallback, type?: string, quality?: any): void {
		this.canvas.toBlob(callback, type, quality);
	}

	// Cleanup
	public dispose(): void {
		this.elements.clear();
		// Canvas will be garbage collected when all references are removed
	}

	// Private Helper Methods
	private getSortedElements(): BaseElement[] {
		// Convert Set to Array and sort by z-index/hierarchy
		const elements = Array.from(this.elements);
		
		// For now, use the order they were added
		// In a full implementation, this would sort by z-index and element hierarchy
		return elements.sort((a, b) => {
			// Basic sorting by element hierarchy depth
			const depthA = this.getElementDepth(a);
			const depthB = this.getElementDepth(b);
			return depthA - depthB;
		});
	}

	private getElementDepth(element: BaseElement): number {
		let depth = 0;
		let current = element.parent;
		while (current) {
			depth++;
			current = current.parent;
		}
		return depth;
	}

	private shouldRenderElement(element: BaseElement, viewport?: Viewport): boolean {
		if (!element.visible || element.opacity <= 0) {
			return false;
		}

		// Basic viewport culling
		if (viewport) {
			const bounds = element.absoluteBounds;
			
			// Check if element bounds intersect with viewport
			if (bounds.x + bounds.width < viewport.x ||
				bounds.x > viewport.x + viewport.width ||
				bounds.y + bounds.height < viewport.y ||
				bounds.y > viewport.y + viewport.height) {
				return false;
			}
		}

		return true;
	}
}

/**
 * Layer manager for organizing and managing multiple layers.
 */
export class LayerManager {
	private layers: Layer[] = [];
	private layerMap = new Map<string, Layer>();

	public createLayer(width: number, height: number, options?: LayerOptions): Layer {
		const layer = new Layer(width, height, options);
		this.addLayer(layer);
		return layer;
	}

	public addLayer(layer: Layer): void {
		if (!this.layerMap.has(layer.id)) {
			this.layers.push(layer);
			this.layerMap.set(layer.id, layer);
		}
	}

	public removeLayer(layer: Layer | string): boolean {
		const layerId = typeof layer === 'string' ? layer : layer.id;
		const layerObj = this.layerMap.get(layerId);
		
		if (layerObj) {
			const index = this.layers.indexOf(layerObj);
			if (index !== -1) {
				this.layers.splice(index, 1);
				this.layerMap.delete(layerId);
				layerObj.dispose();
				return true;
			}
		}
		
		return false;
	}

	public getLayer(id: string): Layer | null {
		return this.layerMap.get(id) || null;
	}

	public getLayers(): Layer[] {
		return [...this.layers];
	}

	public getVisibleLayers(): Layer[] {
		return this.layers.filter(layer => layer.visible && layer.opacity > 0);
	}

	public setLayerOrder(layer: Layer, newIndex: number): void {
		const currentIndex = this.layers.indexOf(layer);
		if (currentIndex === -1) return;

		// Remove from current position
		this.layers.splice(currentIndex, 1);
		
		// Insert at new position
		const clampedIndex = Math.max(0, Math.min(newIndex, this.layers.length));
		this.layers.splice(clampedIndex, 0, layer);
	}

	public moveLayerUp(layer: Layer): boolean {
		const index = this.layers.indexOf(layer);
		if (index > 0) {
			this.setLayerOrder(layer, index - 1);
			return true;
		}
		return false;
	}

	public moveLayerDown(layer: Layer): boolean {
		const index = this.layers.indexOf(layer);
		if (index < this.layers.length - 1) {
			this.setLayerOrder(layer, index + 1);
			return true;
		}
		return false;
	}

	public clear(): void {
		this.layers.forEach(layer => layer.dispose());
		this.layers = [];
		this.layerMap.clear();
	}

	public resizeAll(width: number, height: number): void {
		this.layers.forEach(layer => layer.resize(width, height));
	}

	public invalidateAll(): void {
		this.layers.forEach(layer => layer.invalidate());
	}

	public dispose(): void {
		this.clear();
	}
}