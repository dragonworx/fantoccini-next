/**
 * Basic box element implementation with content rendering.
 * 
 * @namespace core.graphics
 * @memberof core
 */

import { BaseElement } from './BaseElement.js';
import type { Color } from '../types/GraphicsTypes.js';
import type { BoxElementOptions } from '../types/ElementTypes.js';
import { parseColor, rgbaToString } from '../utils/ColorUtils.js';

/**
 * A basic box element that can display text or image content.
 * Extends BaseElement with content rendering capabilities.
 */
export class BoxElement extends BaseElement {
	// Content Properties
	private _content: string | HTMLImageElement | null = null;
	private _textAlign: 'left' | 'center' | 'right' = 'left';
	private _fontSize: number = 16;
	private _fontFamily: string = 'Arial, sans-serif';
	private _fontWeight: 'normal' | 'bold' | number = 'normal';
	private _textColor: Color = '#000000';

	// Cached measurements
	private _textMetrics: TextMetrics | null = null;
	private _measuredImageSize: { width: number; height: number } | null = null;

	constructor(view: any, options: BoxElementOptions = {}) {
		super(view, options);

		// Apply box-specific options
		if (options.content !== undefined) this._content = options.content;
		if (options.textAlign !== undefined) this._textAlign = options.textAlign;
		if (options.fontSize !== undefined) this._fontSize = options.fontSize;
		if (options.fontFamily !== undefined) this._fontFamily = options.fontFamily;
		if (options.fontWeight !== undefined) this._fontWeight = options.fontWeight;
		if (options.textColor !== undefined) this._textColor = options.textColor;
	}

	// Content Properties Getters/Setters
	public get content(): string | HTMLImageElement | null {
		return this._content;
	}

	public set content(value: string | HTMLImageElement | null) {
		if (this._content !== value) {
			this._content = value;
			this._textMetrics = null;
			this._measuredImageSize = null;
			this.invalidateLayout();
			this.invalidateRender();
		}
	}

	public get textAlign(): 'left' | 'center' | 'right' {
		return this._textAlign;
	}

	public set textAlign(value: 'left' | 'center' | 'right') {
		if (this._textAlign !== value) {
			this._textAlign = value;
			this.invalidateRender();
		}
	}

	public get fontSize(): number {
		return this._fontSize;
	}

	public set fontSize(value: number) {
		if (this._fontSize !== value && value > 0) {
			this._fontSize = value;
			this._textMetrics = null;
			this.invalidateLayout();
			this.invalidateRender();
		}
	}

	public get fontFamily(): string {
		return this._fontFamily;
	}

	public set fontFamily(value: string) {
		if (this._fontFamily !== value) {
			this._fontFamily = value;
			this._textMetrics = null;
			this.invalidateLayout();
			this.invalidateRender();
		}
	}

	public get fontWeight(): 'normal' | 'bold' | number {
		return this._fontWeight;
	}

	public set fontWeight(value: 'normal' | 'bold' | number) {
		if (this._fontWeight !== value) {
			this._fontWeight = value;
			this._textMetrics = null;
			this.invalidateLayout();
			this.invalidateRender();
		}
	}

	public get textColor(): Color {
		return this._textColor;
	}

	public set textColor(value: Color) {
		if (this._textColor !== value) {
			this._textColor = value;
			this.invalidateRender();
		}
	}

	// Content Management
	public setContent(content: string | HTMLImageElement): void {
		this.content = content;
	}

	public clearContent(): void {
		this.content = null;
	}

	// Text Style Management
	public setTextStyle(style: {
		fontSize?: number;
		fontFamily?: string;
		fontWeight?: 'normal' | 'bold' | number;
		textColor?: Color;
		textAlign?: 'left' | 'center' | 'right';
	}): void {
		if (style.fontSize !== undefined) this.fontSize = style.fontSize;
		if (style.fontFamily !== undefined) this.fontFamily = style.fontFamily;
		if (style.fontWeight !== undefined) this.fontWeight = style.fontWeight;
		if (style.textColor !== undefined) this.textColor = style.textColor;
		if (style.textAlign !== undefined) this.textAlign = style.textAlign;
	}

	// Text Measurement
	public measureText(): TextMetrics | null {
		if (!this._content || typeof this._content !== 'string') {
			return null;
		}

		if (!this._textMetrics) {
			const canvas = this.getOffscreenCanvas();
			const context = canvas.getContext('2d')!;
			context.font = this.buildFontString();
			this._textMetrics = context.measureText(this._content);
		}

		return this._textMetrics;
	}

	// Required render method from BaseElement
	public render(context: CanvasRenderingContext2D): void {
		// Render background and border from BaseElement
		this.renderBackground(context);
		
		// Then render content
		this.renderContent(context);
	}

	// Content Rendering
	protected renderContent(context: CanvasRenderingContext2D): void {
		if (!this._content) {
			return;
		}

		if (typeof this._content === 'string') {
			this.renderText(context);
		} else if (this._content instanceof HTMLImageElement) {
			this.renderImage(context);
		}
	}

	private renderText(context: CanvasRenderingContext2D): void {
		const text = this._content as string;
		const bounds = this.computedBounds;
		
		// Set up text rendering
		context.font = this.buildFontString();
		context.fillStyle = this._textColor as string;
		context.textBaseline = 'middle';

		// Calculate text position based on alignment
		let x: number;
		switch (this._textAlign) {
			case 'center':
				x = bounds.x + bounds.width / 2;
				context.textAlign = 'center';
				break;
			case 'right':
				x = bounds.x + bounds.width;
				context.textAlign = 'right';
				break;
			default:
				x = bounds.x;
				context.textAlign = 'left';
				break;
		}

		const y = bounds.y + bounds.height / 2;

		// Handle text overflow (basic implementation)
		const metrics = this.measureText();
		if (metrics && metrics.width > bounds.width) {
			// Text is too wide, clip it
			context.save();
			context.beginPath();
			context.rect(bounds.x, bounds.y, bounds.width, bounds.height);
			context.clip();
			context.fillText(text, x, y);
			context.restore();
		} else {
			context.fillText(text, x, y);
		}
	}

	private renderImage(context: CanvasRenderingContext2D): void {
		const image = this._content as HTMLImageElement;
		const bounds = this.computedBounds;

		if (!image.complete) {
			// Image not loaded yet, could show placeholder
			return;
		}

		// Calculate image size and position (basic fit-cover implementation)
		const imageAspect = image.naturalWidth / image.naturalHeight;
		const boundsAspect = bounds.width / bounds.height;

		let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

		if (imageAspect > boundsAspect) {
			// Image is wider than bounds
			drawHeight = bounds.height;
			drawWidth = drawHeight * imageAspect;
			drawX = bounds.x + (bounds.width - drawWidth) / 2;
			drawY = bounds.y;
		} else {
			// Image is taller than bounds
			drawWidth = bounds.width;
			drawHeight = drawWidth / imageAspect;
			drawX = bounds.x;
			drawY = bounds.y + (bounds.height - drawHeight) / 2;
		}

		context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
	}

	// Helper Methods
	private buildFontString(): string {
		return `${this._fontWeight} ${this._fontSize}px ${this._fontFamily}`;
	}

	private getOffscreenCanvas(): HTMLCanvasElement {
		// Create a static offscreen canvas for text measurement
		if (!BoxElement._offscreenCanvas) {
			BoxElement._offscreenCanvas = document.createElement('canvas');
			BoxElement._offscreenCanvas.width = 1;
			BoxElement._offscreenCanvas.height = 1;
		}
		return BoxElement._offscreenCanvas;
	}

	// Static offscreen canvas for text measurement
	private static _offscreenCanvas: HTMLCanvasElement | null = null;

	// Override containsPoint for more precise hit testing with content
	public containsPoint(x: number, y: number): boolean {
		// First check basic bounds
		if (!super.containsPoint(x, y)) {
			return false;
		}

		// For now, use basic rectangle hit testing
		// Could be enhanced for more precise content-aware hit testing
		return true;
	}

	// Content-aware measurement for Yoga layout
	protected measureForYoga(
		width: number,
		widthMeasureMode: any, // YogaMeasureMode
		height: number,
		heightMeasureMode: any // YogaMeasureMode
	): { width: number; height: number } {
		if (!this._content) {
			return { width: 0, height: 0 };
		}

		if (typeof this._content === 'string') {
			const metrics = this.measureText();
			if (metrics) {
				return {
					width: Math.min(metrics.width, width),
					height: this._fontSize * 1.2 // Basic line height
				};
			}
		} else if (this._content instanceof HTMLImageElement && this._content.complete) {
			const imageAspect = this._content.naturalWidth / this._content.naturalHeight;
			
			if (widthMeasureMode === 1 && heightMeasureMode === 1) { // Both exact
				return { width, height };
			} else if (widthMeasureMode === 1) { // Width exact
				return { width, height: width / imageAspect };
			} else if (heightMeasureMode === 1) { // Height exact
				return { width: height * imageAspect, height };
			} else {
				// Use natural size, constrained by available space
				return {
					width: Math.min(this._content.naturalWidth, width),
					height: Math.min(this._content.naturalHeight, height)
				};
			}
		}

		return { width: 0, height: 0 };
	}

	// Cleanup
	public dispose(): void {
		this._textMetrics = null;
		this._measuredImageSize = null;
		super.dispose();
	}
}