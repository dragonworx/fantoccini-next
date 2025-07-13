/**
 * Base element class for the graphics rendering system.
 * 
 * @namespace core.graphics
 * @memberof core
 */

import { EventEmitter } from '../../event-emitter.js';
import type { 
	Point, 
	Rectangle, 
	Transform2D, 
	Color, 
	EdgeValues, 
	CornerValues 
} from '../types/GraphicsTypes.js';
import type { 
	ElementEventMap, 
	BaseElementOptions,
	ElementState,
	ComputedStyle
} from '../types/ElementTypes.js';
import type { LayoutStyle, LayoutBox } from '../layout/FlexLayout.js';
import { 
	createTransform, 
	normalizeEdgeValues, 
	normalizeCornerValues,
	pointInRectangle
} from '../utils/MathUtils.js';

let elementIdCounter = 0;

/**
 * Base class for all graphics elements in the rendering system.
 * Provides hierarchy management, layout integration, and event handling.
 */
export abstract class BaseElement extends EventEmitter<ElementEventMap> {
	// Core Properties
	public readonly id: string;
	public readonly view: any; // Will be View when implemented

	// Hierarchy
	public parent: BaseElement | null = null;
	public children: BaseElement[] = [];

	// Layout Properties (delegated to layout system)
	private _layoutStyle: LayoutStyle = {};

	// Visual Properties
	private _visible: boolean = true;
	private _opacity: number = 1;
	private _backgroundColor: Color | null = null;
	private _borderColor: Color | null = null;
	private _borderWidth: EdgeValues = 0;
	private _borderRadius: CornerValues = 0;

	// Transform
	private _transform: Transform2D = createTransform();

	// State
	private _state: ElementState = {
		dirty: true,
		layoutDirty: true,
		renderDirty: true,
		visible: true,
		opacity: 1,
		transform: createTransform(),
		computedBounds: { x: 0, y: 0, width: 0, height: 0 },
		absoluteBounds: { x: 0, y: 0, width: 0, height: 0 }
	};

	// Computed Layout (set by layout system)
	private _computedLayout: LayoutBox = { x: 0, y: 0, width: 0, height: 0 };

	constructor(view: any, options: BaseElementOptions = {}) {
		super();
		
		this.id = options.id || `element-${elementIdCounter++}`;
		this.view = view;

		// Apply initial options
		if (options.visible !== undefined) this._visible = options.visible;
		if (options.opacity !== undefined) this._opacity = options.opacity;
		if (options.backgroundColor !== undefined) this._backgroundColor = options.backgroundColor;
		if (options.borderColor !== undefined) this._borderColor = options.borderColor;
		if (options.borderWidth !== undefined) this._borderWidth = options.borderWidth;
		if (options.borderRadius !== undefined) this._borderRadius = options.borderRadius;
		if (options.transform) {
			this._transform = { ...createTransform(), ...options.transform };
		}

		// Apply layout properties
		if (options.layoutProperties) {
			this.setLayoutProperties(options.layoutProperties);
		}

		// Register with view's layout system
		if (this.view && this.view.layoutBinding) {
			this.view.layoutBinding.bindElement(this, this._layoutStyle);
		}
	}

	// Layout Properties
	public get layoutStyle(): LayoutStyle {
		return { ...this._layoutStyle };
	}

	public setLayoutProperties(properties: Partial<LayoutStyle>): void {
		Object.assign(this._layoutStyle, properties);
		
		// Update layout system
		if (this.view && this.view.layoutBinding) {
			this.view.layoutBinding.setElementStyle(this, properties);
		}
		
		this.invalidateLayout();
	}

	public setLayoutProperty<K extends keyof LayoutStyle>(key: K, value: LayoutStyle[K]): void {
		this._layoutStyle[key] = value;
		
		// Update layout system
		if (this.view && this.view.layoutBinding) {
			this.view.layoutBinding.setElementStyle(this, { [key]: value });
		}
		
		this.invalidateLayout();
	}

	// Layout result (set by layout system)
	public setLayoutResult(layout: LayoutBox): void {
		const oldLayout = { ...this._computedLayout };
		this._computedLayout = { ...layout };
		
		// Update computed bounds
		this._state.computedBounds = {
			x: layout.x,
			y: layout.y,
			width: layout.width,
			height: layout.height
		};

		// Calculate absolute bounds (considering parent positioning)
		this.updateAbsoluteBounds();

		// Mark render dirty if layout changed
		if (oldLayout.x !== layout.x || oldLayout.y !== layout.y || 
			oldLayout.width !== layout.width || oldLayout.height !== layout.height) {
			this.invalidateRender();
			
			// Emit layout change event
			this.emit('layout:change', {
				element: this,
				oldLayout,
				newLayout: layout
			});
		}
	}

	public getLayoutResult(): LayoutBox {
		return { ...this._computedLayout };
	}

	// Convenience layout property setters
	public get width(): number | 'auto' { return this._layoutStyle.width ?? 'auto'; }
	public set width(value: number | 'auto') {
		this.setLayoutProperty('width', value);
	}

	public get height(): number | 'auto' { return this._layoutStyle.height ?? 'auto'; }
	public set height(value: number | 'auto') {
		this.setLayoutProperty('height', value);
	}

	public get flexGrow(): number { return this._layoutStyle.flexGrow ?? 0; }
	public set flexGrow(value: number) {
		this.setLayoutProperty('flexGrow', value);
	}

	public get flexShrink(): number { return this._layoutStyle.flexShrink ?? 1; }
	public set flexShrink(value: number) {
		this.setLayoutProperty('flexShrink', value);
	}

	public get flexDirection(): LayoutStyle['flexDirection'] { return this._layoutStyle.flexDirection ?? 'row'; }
	public set flexDirection(value: LayoutStyle['flexDirection']) {
		this.setLayoutProperty('flexDirection', value);
	}

	public get justifyContent(): LayoutStyle['justifyContent'] { return this._layoutStyle.justifyContent ?? 'flex-start'; }
	public set justifyContent(value: LayoutStyle['justifyContent']) {
		this.setLayoutProperty('justifyContent', value);
	}

	public get alignItems(): LayoutStyle['alignItems'] { return this._layoutStyle.alignItems ?? 'stretch'; }
	public set alignItems(value: LayoutStyle['alignItems']) {
		this.setLayoutProperty('alignItems', value);
	}

	// Visual Properties
	public get visible(): boolean { return this._visible; }
	public set visible(value: boolean) {
		if (this._visible !== value) {
			this._visible = value;
			this._state.visible = value;
			this.invalidateRender();
			this.emit('visibility:change', { element: this, visible: value });
		}
	}

	public get opacity(): number { return this._opacity; }
	public set opacity(value: number) {
		const clampedValue = Math.max(0, Math.min(1, value));
		if (this._opacity !== clampedValue) {
			this._opacity = clampedValue;
			this._state.opacity = clampedValue;
			this.invalidateRender();
		}
	}

	public get backgroundColor(): Color | null { return this._backgroundColor; }
	public set backgroundColor(value: Color | null) {
		if (this._backgroundColor !== value) {
			this._backgroundColor = value;
			this.invalidateRender();
		}
	}

	public get borderColor(): Color | null { return this._borderColor; }
	public set borderColor(value: Color | null) {
		if (this._borderColor !== value) {
			this._borderColor = value;
			this.invalidateRender();
		}
	}

	public get borderWidth(): EdgeValues { return this._borderWidth; }
	public set borderWidth(value: EdgeValues) {
		this._borderWidth = value;
		this.invalidateRender();
	}

	public get borderRadius(): CornerValues { return this._borderRadius; }
	public set borderRadius(value: CornerValues) {
		this._borderRadius = value;
		this.invalidateRender();
	}

	public get transform(): Transform2D { return { ...this._transform }; }
	public set transform(value: Partial<Transform2D>) {
		this._transform = { ...this._transform, ...value };
		this._state.transform = { ...this._transform };
		this.updateAbsoluteBounds();
		this.invalidateRender();
	}

	// Hierarchy Management
	public appendChild(child: BaseElement): void {
		this.insertChild(child, this.children.length);
	}

	public insertChild(child: BaseElement, index: number): void {
		// Remove from previous parent
		if (child.parent) {
			child.parent.removeChild(child);
		}

		// Insert at specified index
		const clampedIndex = Math.max(0, Math.min(index, this.children.length));
		this.children.splice(clampedIndex, 0, child);
		child.parent = this;

		// Notify layout system of hierarchy change
		if (this.view && this.view.layoutBinding) {
			this.view.layoutBinding.syncElementHierarchy(this);
		}

		// Emit events
		this.emit('child:added', { parent: this, child, index: clampedIndex });
		child.emit('parent:changed', { element: child, oldParent: null, newParent: this });

		this.invalidateLayout();
	}

	public removeChild(child: BaseElement): void {
		const index = this.children.indexOf(child);
		if (index !== -1) {
			this.children.splice(index, 1);
			const oldParent = child.parent;
			child.parent = null;

			// Notify layout system of hierarchy change
			if (this.view && this.view.layoutBinding) {
				this.view.layoutBinding.syncElementHierarchy(this);
			}

			// Emit events
			this.emit('child:removed', { parent: this, child, index });
			child.emit('parent:changed', { element: child, oldParent, newParent: null });

			this.invalidateLayout();
		}
	}

	public remove(): void {
		if (this.parent) {
			this.parent.removeChild(this);
		}
	}

	// State Management
	public invalidateLayout(): void {
		this._state.layoutDirty = true;
		this._state.dirty = true;
		
		// Mark view layout as needing recalculation
		if (this.view && this.view.layoutBinding) {
			this.view.layoutBinding.calculateLayout();
		}
	}

	public invalidateRender(): void {
		this._state.renderDirty = true;
		this._state.dirty = true;

		// Propagate to view
		if (this.view && this.view.invalidate) {
			this.view.invalidate();
		}
	}

	public get isDirty(): boolean {
		return this._state.dirty;
	}

	public get isLayoutDirty(): boolean {
		return this._state.layoutDirty;
	}

	public get isRenderDirty(): boolean {
		return this._state.renderDirty;
	}

	public markClean(): void {
		this._state.dirty = false;
		this._state.layoutDirty = false;
		this._state.renderDirty = false;
	}

	// Bounds and Hit Testing
	public get computedBounds(): Rectangle {
		return { ...this._state.computedBounds };
	}

	public get absoluteBounds(): Rectangle {
		return { ...this._state.absoluteBounds };
	}

	private updateAbsoluteBounds(): void {
		const bounds = this._state.computedBounds;
		let absoluteX = bounds.x;
		let absoluteY = bounds.y;

		// Add parent's absolute position
		if (this.parent) {
			const parentAbsolute = this.parent.absoluteBounds;
			absoluteX += parentAbsolute.x;
			absoluteY += parentAbsolute.y;
		}

		// Apply transform
		if (this._transform.translateX || this._transform.translateY) {
			absoluteX += this._transform.translateX;
			absoluteY += this._transform.translateY;
		}

		this._state.absoluteBounds = {
			x: absoluteX,
			y: absoluteY,
			width: bounds.width,
			height: bounds.height
		};

		// Update children's absolute bounds
		this.children.forEach(child => child.updateAbsoluteBounds());
	}

	public hitTest(point: Point): boolean {
		if (!this._visible || this._opacity === 0) {
			return false;
		}

		return pointInRectangle(point, this._state.absoluteBounds);
	}

	public findElementAt(point: Point): BaseElement | null {
		// Check children first (front to back)
		for (let i = this.children.length - 1; i >= 0; i--) {
			const child = this.children[i];
			const found = child.findElementAt(point);
			if (found) {
				return found;
			}
		}

		// Check self
		if (this.hitTest(point)) {
			return this;
		}

		return null;
	}

	// Computed Style
	public getComputedStyle(): ComputedStyle {
		return {
			backgroundColor: this._backgroundColor,
			borderColor: this._borderColor,
			borderWidth: normalizeEdgeValues(this._borderWidth),
			borderRadius: normalizeCornerValues(this._borderRadius),
			opacity: this._opacity,
			transform: { ...this._transform }
		};
	}

	// Rendering
	public abstract render(context: CanvasRenderingContext2D): void;

	protected renderBackground(context: CanvasRenderingContext2D): void {
		const bounds = this.computedBounds;
		const style = this.getComputedStyle();

		if (style.backgroundColor) {
			context.save();
			
			// Apply border radius if specified
			if (typeof style.borderRadius === 'object' || style.borderRadius > 0) {
				const radius = normalizeCornerValues(style.borderRadius);
				this.drawRoundedRect(context, bounds, radius);
				context.clip();
			}

			context.fillStyle = style.backgroundColor;
			context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
			
			context.restore();
		}
	}

	protected renderBorder(context: CanvasRenderingContext2D): void {
		const bounds = this.computedBounds;
		const style = this.getComputedStyle();

		if (style.borderColor && style.borderWidth) {
			context.save();
			
			context.strokeStyle = style.borderColor;
			
			const borderWidth = normalizeEdgeValues(style.borderWidth);
			context.lineWidth = borderWidth.top; // Simplified - use top border width

			if (typeof style.borderRadius === 'object' || style.borderRadius > 0) {
				const radius = normalizeCornerValues(style.borderRadius);
				this.drawRoundedRect(context, bounds, radius);
				context.stroke();
			} else {
				context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
			}
			
			context.restore();
		}
	}

	private drawRoundedRect(context: CanvasRenderingContext2D, bounds: Rectangle, radius: any): void {
		const { x, y, width, height } = bounds;
		
		context.beginPath();
		context.moveTo(x + radius.topLeft, y);
		context.lineTo(x + width - radius.topRight, y);
		context.quadraticCurveTo(x + width, y, x + width, y + radius.topRight);
		context.lineTo(x + width, y + height - radius.bottomRight);
		context.quadraticCurveTo(x + width, y + height, x + width - radius.bottomRight, y + height);
		context.lineTo(x + radius.bottomLeft, y + height);
		context.quadraticCurveTo(x, y + height, x, y + height - radius.bottomLeft);
		context.lineTo(x, y + radius.topLeft);
		context.quadraticCurveTo(x, y, x + radius.topLeft, y);
		context.closePath();
	}

	// Property change notification (for layout system integration)
	protected notifyPropertyChange(property: string): void {
		// Override in subclasses if needed
	}

	// Cleanup
	public dispose(): void {
		// Remove from parent
		if (this.parent) {
			this.parent.removeChild(this);
		}

		// Remove all children
		while (this.children.length > 0) {
			this.removeChild(this.children[0]);
		}

		// Unbind from layout system
		if (this.view && this.view.layoutBinding) {
			this.view.layoutBinding.unbindElement(this);
		}

		// Remove all event listeners
		this.removeAllListeners();
	}
}