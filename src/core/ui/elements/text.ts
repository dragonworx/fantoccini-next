/**
 * Text element for rendering text
 * @namespace core.ui
 * @memberof core.ui
 */

import { Text as TroikaText } from 'troika-three-text';
import { Element } from './element';
import type { IElementConfig, ITextStyle } from '../types';
import { DirtyFlags } from '../types';

/**
 * Default text style
 */
const DEFAULT_TEXT_STYLE: ITextStyle = {
	fontFamily: 'sans-serif',
	fontSize: 16,
	fontWeight: 'normal',
	fontStyle: 'normal',
	color: 0x000000,
	textAlign: 'left',
	lineHeight: 1.2,
	letterSpacing: 0,
	overflow: 'visible'
};

/**
 * Text configuration interface
 */
export interface ITextConfig extends IElementConfig {
	text?: string;
	style?: Partial<ITextStyle>;
}

/**
 * A specialized Element for rendering text content
 * @memberof core.ui
 */
export class Text extends Element {
	// Text properties
	private _text: string = '';
	private _style: ITextStyle;
	
	// Troika text object
	private troikaText: TroikaText | null = null;

	/**
	 * Creates a new Text element
	 */
	public constructor(text: string = '', config?: ITextConfig) {
		super(config);
		
		this._text = config?.text || text;
		this._style = { ...DEFAULT_TEXT_STYLE, ...config?.style };
	}

	/**
	 * Get text content
	 */
	public get text(): string {
		return this._text;
	}

	/**
	 * Set text content
	 */
	public set text(value: string) {
		if (this._text !== value) {
			this._text = value;
			this.markDirty(DirtyFlags.Content);
			this.updateTextContent();
		}
	}

	/**
	 * Get text style
	 */
	public get style(): ITextStyle {
		return { ...this._style };
	}

	/**
	 * Set text style
	 */
	public set style(value: Partial<ITextStyle>) {
		const changed = Object.keys(value).some(key => {
			const k = key as keyof ITextStyle;
			return this._style[k] !== value[k];
		});

		if (changed) {
			Object.assign(this._style, value);
			this.markDirty(DirtyFlags.Appearance);
			this.updateTextStyle();
		}
	}

	/**
	 * Set individual text style property
	 */
	public setStyle(style: Partial<ITextStyle>): void {
		this.style = style;
	}

	/**
	 * Set text content
	 */
	public setText(text: string): void {
		this.text = text;
	}

	/**
	 * Override createThreeObjects to create text
	 */
	protected createThreeObjects(): void {
		// Create Troika text
		this.troikaText = new TroikaText();
		this.mesh = this.troikaText as unknown as THREE.Mesh;
		this.mesh.userData.element = this;
		
		// Set initial properties
		this.updateTextContent();
		this.updateTextStyle();
		this.updateTransform();
		
		// Sync text to generate geometry
		this.troikaText.sync();
	}

	/**
	 * Update text content
	 */
	private updateTextContent(): void {
		if (!this.troikaText) {
			return;
		}
		
		this.troikaText.text = this._text;
		
		// Update geometry based on text bounds
		this.troikaText.sync(() => {
			// After sync, update element size based on text bounds
			const bounds = this.troikaText!.textRenderInfo?.blockBounds;
			if (bounds) {
				const width = bounds[2] - bounds[0];
				const height = bounds[3] - bounds[1];
				
				// Only update if auto-sizing (when width/height not explicitly set)
				if (this._geometry.width === 100 && this._geometry.height === 100) {
					this._geometry.width = width;
					this._geometry.height = height;
					this.markDirty(DirtyFlags.Geometry);
				}
			}
		});
	}

	/**
	 * Update text style
	 */
	private updateTextStyle(): void {
		if (!this.troikaText) {
			return;
		}
		
		// Font properties
		// Only set font if it's a URL (troika expects font file URLs, not font family names)
		if (this._style.fontFamily.includes('://') || this._style.fontFamily.endsWith('.ttf') || 
		    this._style.fontFamily.endsWith('.otf') || this._style.fontFamily.endsWith('.woff')) {
			this.troikaText.font = this._style.fontFamily;
		}
		// Otherwise use default Roboto font from troika
		
		this.troikaText.fontSize = this._style.fontSize;
		this.troikaText.fontWeight = this._style.fontWeight;
		this.troikaText.fontStyle = this._style.fontStyle;
		
		// Color
		this.troikaText.color = this._style.color;
		
		// Text layout
		this.troikaText.textAlign = this._style.textAlign;
		this.troikaText.lineHeight = this._style.lineHeight;
		this.troikaText.letterSpacing = this._style.letterSpacing;
		
		// Bounds
		this.troikaText.maxWidth = this._geometry.width;
		if (this._style.maxLines) {
			this.troikaText.maxLines = this._style.maxLines;
		}
		
		// Overflow
		switch (this._style.overflow) {
		case 'hidden':
			this.troikaText.clipRect = [0, -this._geometry.height, this._geometry.width, 0];
			break;
		case 'ellipsis':
			this.troikaText.overflowWrap = 'break-word';
			this.troikaText.whiteSpace = 'normal';
			break;
		default:
			this.troikaText.clipRect = null;
			break;
		}
		
		// Sync to update
		this.troikaText.sync();
	}

	/**
	 * Override updateTransform for text positioning
	 */
	protected updateTransform(): void {
		if (!this.troikaText) {
			return;
		}
		
		// Position text at top-left of element bounds
		this.troikaText.position.x = this._geometry.left;
		this.troikaText.position.y = -this._geometry.top;
		this.troikaText.position.z = 0.1; // Slightly in front
		
		// Set anchor based on alignment
		switch (this._style.textAlign) {
		case 'center':
			this.troikaText.anchorX = 'center';
			this.troikaText.position.x += this._geometry.width / 2;
			break;
		case 'right':
			this.troikaText.anchorX = 'right';
			this.troikaText.position.x += this._geometry.width;
			break;
		default:
			this.troikaText.anchorX = 'left';
			break;
		}
		
		// Always anchor at top
		this.troikaText.anchorY = 'top';
		
		this.clearDirty(DirtyFlags.Geometry | DirtyFlags.Transform);
	}

	/**
	 * Override updateAppearance to handle text-specific appearance
	 */
	protected updateAppearance(): void {
		// Text doesn't use the standard material, so just update style
		this.updateTextStyle();
		this.clearDirty(DirtyFlags.Appearance);
	}

	/**
	 * Override update to handle text updates
	 */
	public update(): void {
		if (!this.isDirty()) {
			return;
		}
		
		if (this.isDirty(DirtyFlags.Content)) {
			this.updateTextContent();
			this.clearDirty(DirtyFlags.Content);
		}
		
		if (this.isDirty(DirtyFlags.Geometry | DirtyFlags.Transform)) {
			this.updateTransform();
		}
		
		if (this.isDirty(DirtyFlags.Appearance)) {
			this.updateAppearance();
		}
	}

	/**
	 * Get character bounds at index
	 */
	public getCharacterBounds(index: number): { x: number; y: number; width: number; height: number } | null {
		if (!this.troikaText || !this.troikaText.textRenderInfo) {
			return null;
		}
		
		const info = this.troikaText.textRenderInfo;
		if (!info.caretPositions || index >= info.caretPositions.length / 3) {
			return null;
		}
		
		// Get caret position for character
		const x = info.caretPositions[index * 3];
		const y = info.caretPositions[index * 3 + 1];
		
		// Estimate character width (rough approximation)
		const nextX = index < info.caretPositions.length / 3 - 1 
			? info.caretPositions[(index + 1) * 3]
			: x + this._style.fontSize * 0.5;
		
		return {
			x: this._geometry.left + x,
			y: this._geometry.top + y,
			width: nextX - x,
			height: this._style.fontSize * this._style.lineHeight
		};
	}

	/**
	 * Override destroyThreeObjects
	 */
	protected destroyThreeObjects(): void {
		if (this.troikaText) {
			this.troikaText.dispose();
			this.troikaText = null;
		}
		this.mesh = null;
	}
}