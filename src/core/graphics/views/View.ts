/**
 * Main view class for graphics rendering and canvas management.
 * 
 * @namespace core.graphics
 * @memberof core
 */

import { EventEmitter } from '../../event-emitter.js';
import { BaseElement } from '../elements/BaseElement.js';
import { BoxElement } from '../elements/BoxElement.js';
import { Layer, LayerManager } from './Layer.js';
import { LayerCompositor } from '../rendering/LayerCompositor.js';
import { LayoutBinding, LayoutPropertyManager } from '../layout/LayoutBinding.js';
import type { 
	Point, 
	Viewport, 
	Color, 
	ViewOptions 
} from '../types/GraphicsTypes.js';
import type { 
	ViewEventMap, 
	RenderContext,
	InteractionStartEventData,
	InteractionEndEventData
} from '../types/RenderTypes.js';
import type { ElementConstructor } from '../types/ElementTypes.js';
import type { LayoutStyle } from '../layout/FlexLayout.js';

/**
 * Root element for the view - acts as the container for all other elements.
 */
class RootElement extends BaseElement {
	constructor(view: View) {
		super(view, {
			id: 'root'
		});
	}

	render(context: CanvasRenderingContext2D): void {
		// Root element doesn't render anything itself
		// Children are rendered by the view
	}
}

/**
 * Main view class that manages canvas, layers, and rendering pipeline.
 */
export class View extends EventEmitter<ViewEventMap> {
	// Core Properties
	public readonly canvas: HTMLCanvasElement;
	public readonly context: CanvasRenderingContext2D;
	public readonly rootElement: BaseElement;

	// Layer Management
	public readonly layerManager: LayerManager;
	public readonly layerCompositor: LayerCompositor;
	private defaultLayer: Layer;

	// Layout System
	public readonly layoutBinding: LayoutBinding;
	public readonly layoutManager: LayoutPropertyManager;

	// Viewport and Rendering
	private _viewport: Viewport;
	private _pixelRatio: number;
	private _backgroundColor: Color;
	private _mounted: boolean = false;
	private _frameId: number = 0;
	private _renderRequested: boolean = false;

	// Event Handling
	private _eventsEnabled: boolean = true;
	private _interactionStarted: boolean = false;

	// Performance
	private _renderStats = {
		frameTime: 0,
		elementsRendered: 0,
		drawCalls: 0
	};

	constructor(width: number, height: number, options: ViewOptions = {}) {
		super();

		// Create canvas
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d')!;
		
		// Set pixel ratio
		this._pixelRatio = options.pixelRatio ?? window.devicePixelRatio ?? 1;
		
		// Configure canvas
		this.canvas.width = width * this._pixelRatio;
		this.canvas.height = height * this._pixelRatio;
		this.canvas.style.width = `${width}px`;
		this.canvas.style.height = `${height}px`;
		this.context.scale(this._pixelRatio, this._pixelRatio);

		// Initialize viewport
		this._viewport = {
			x: 0,
			y: 0,
			width,
			height,
			scale: 1
		};

		// Set background color
		this._backgroundColor = options.backgroundColor ?? '#ffffff';

		// Initialize layout system
		this.layoutBinding = new LayoutBinding();
		this.layoutManager = new LayoutPropertyManager(this.layoutBinding);

		// Create root element
		this.rootElement = new RootElement(this);
		this.layoutBinding.setRootElement(this.rootElement, {
			width: width,
			height: height,
			flexDirection: 'column'
		});

		// Initialize layer management
		this.layerManager = new LayerManager();
		this.layerCompositor = new LayerCompositor(this.canvas);
		this.defaultLayer = this.layerManager.createLayer('default');

		// Enable events by default
		this._eventsEnabled = options.enableEvents ?? true;
		
		if (this._eventsEnabled) {
			this.setupEventHandlers();
		}
	}

	// Viewport Management
	public get viewport(): Viewport {
		return { ...this._viewport };
	}

	public setViewport(viewport: Partial<Viewport>): void {
		const oldViewport = { ...this._viewport };
		Object.assign(this._viewport, viewport);

		// Update canvas size if dimensions changed
		if (viewport.width !== undefined || viewport.height !== undefined) {
			const newWidth = this._viewport.width;
			const newHeight = this._viewport.height;
			
			this.canvas.width = newWidth * this._pixelRatio;
			this.canvas.height = newHeight * this._pixelRatio;
			this.canvas.style.width = `${newWidth}px`;
			this.canvas.style.height = `${newHeight}px`;
			this.context.scale(this._pixelRatio, this._pixelRatio);

			// Update root element size
			this.layoutManager.setSize(this.rootElement, newWidth, newHeight);
		}

		this.emit('viewport:change', { oldViewport, newViewport: this._viewport });
		this.invalidate();
	}

	public get pixelRatio(): number {
		return this._pixelRatio;
	}

	public get backgroundColor(): Color {
		return this._backgroundColor;
	}

	public set backgroundColor(color: Color) {
		this._backgroundColor = color;
		this.invalidate();
	}

	// DOM Integration
	public mount(container: HTMLElement): void {
		if (this._mounted) {
			throw new Error('View is already mounted');
		}

		container.appendChild(this.canvas);
		this._mounted = true;

		// Initial render
		this.render();
	}

	public unmount(): void {
		if (!this._mounted) return;

		if (this.canvas.parentElement) {
			this.canvas.parentElement.removeChild(this.canvas);
		}
		
		this._mounted = false;
	}

	public get isMounted(): boolean {
		return this._mounted;
	}

	// Element Creation
	public createElement<T extends BaseElement>(
		ElementClass: ElementConstructor<T>, 
		options: any = {}
	): T {
		return new ElementClass(this, options);
	}

	// Layout Management
	public calculateLayout(): void {
		// Calculate layout using our flex system
		this.layoutBinding.calculateLayout(this._viewport.width, this._viewport.height);
		
		// Apply layout results to elements
		this.layoutBinding.applyLayoutToElements();

		this.emit('layout:complete', {
			timestamp: performance.now(),
			elementsCalculated: this.getElementCount()
		});
	}

	public invalidate(): void {
		if (this._renderRequested) return;
		
		this._renderRequested = true;
		requestAnimationFrame(() => {
			this.render();
			this._renderRequested = false;
		});
	}

	// Rendering Pipeline
	public render(): void {
		const startTime = performance.now();
		this._frameId++;

		this.emit('render:start', {
			frameId: this._frameId,
			timestamp: startTime,
			layersRendered: 0,
			elementsRendered: 0
		});

		// Calculate layout if needed
		if (this.layoutBinding.needsLayout()) {
			this.calculateLayout();
		}

		// Clear canvas
		this.context.save();
		this.context.fillStyle = this._backgroundColor;
		this.context.fillRect(0, 0, this._viewport.width, this._viewport.height);
		this.context.restore();

		// Reset render stats
		this._renderStats.elementsRendered = 0;
		this._renderStats.drawCalls = 0;

		// Render all elements
		this.renderElement(this.rootElement);

		// Update render stats
		const endTime = performance.now();
		this._renderStats.frameTime = endTime - startTime;

		this.emit('render:complete', {
			frameId: this._frameId,
			timestamp: endTime,
			duration: this._renderStats.frameTime,
			layersRendered: 1, // Simplified - using single layer for now
			elementsRendered: this._renderStats.elementsRendered
		});
	}

	private renderElement(element: BaseElement): void {
		if (!element.visible || element.opacity === 0) {
			return;
		}

		this.context.save();

		// Apply opacity
		if (element.opacity < 1) {
			this.context.globalAlpha *= element.opacity;
		}

		// Render the element
		element.render(this.context);
		this._renderStats.elementsRendered++;
		this._renderStats.drawCalls++;

		// Render children
		element.children.forEach(child => {
			this.renderElement(child);
		});

		this.context.restore();
	}

	// Event Handling
	private setupEventHandlers(): void {
		// Mouse events
		this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
		this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
		this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
		this.canvas.addEventListener('click', this.handleClick.bind(this));
		this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
		
		// Touch events
		this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
		this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
		this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
		
		// Keyboard events (when canvas has focus)
		this.canvas.addEventListener('keydown', this.handleKeyDown.bind(this));
		this.canvas.addEventListener('keyup', this.handleKeyUp.bind(this));
		
		// Make canvas focusable
		this.canvas.tabIndex = 0;
	}

	private getElementAtPoint(point: Point): BaseElement | null {
		return this.rootElement.findElementAt(point);
	}

	private createMouseEventData(e: MouseEvent): any {
		const rect = this.canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		
		return {
			x,
			y,
			button: e.button,
			buttons: e.buttons,
			ctrlKey: e.ctrlKey,
			shiftKey: e.shiftKey,
			altKey: e.altKey,
			metaKey: e.metaKey,
			target: this.getElementAtPoint({ x, y }),
			currentTarget: null // Will be set by element
		};
	}

	private handleMouseDown(e: MouseEvent): void {
		const eventData = this.createMouseEventData(e);
		const target = eventData.target;
		
		if (target) {
			eventData.currentTarget = target;
			target.emit('mousedown', eventData);
			
			this._interactionStarted = true;
			this.emit('interaction:start', {
				type: 'mousedown',
				position: { x: eventData.x, y: eventData.y },
				target
			});
		}
	}

	private handleMouseUp(e: MouseEvent): void {
		const eventData = this.createMouseEventData(e);
		const target = eventData.target;
		
		if (target) {
			eventData.currentTarget = target;
			target.emit('mouseup', eventData);
		}

		if (this._interactionStarted) {
			this._interactionStarted = false;
			this.emit('interaction:end', {
				type: 'mouseup',
				position: { x: eventData.x, y: eventData.y },
				target,
				duration: 0 // Could track actual duration
			});
		}
	}

	private handleMouseMove(e: MouseEvent): void {
		const eventData = this.createMouseEventData(e);
		const target = eventData.target;
		
		if (target) {
			eventData.currentTarget = target;
			target.emit('mousemove', eventData);
		}
	}

	private handleClick(e: MouseEvent): void {
		const eventData = this.createMouseEventData(e);
		const target = eventData.target;
		
		if (target) {
			eventData.currentTarget = target;
			target.emit('click', eventData);
		}
	}

	private handleDoubleClick(e: MouseEvent): void {
		const eventData = this.createMouseEventData(e);
		const target = eventData.target;
		
		if (target) {
			eventData.currentTarget = target;
			target.emit('dblclick', eventData);
		}
	}

	private handleTouchStart(e: TouchEvent): void {
		e.preventDefault();
		// Touch event handling would be similar to mouse events
	}

	private handleTouchMove(e: TouchEvent): void {
		e.preventDefault();
		// Touch event handling
	}

	private handleTouchEnd(e: TouchEvent): void {
		e.preventDefault();
		// Touch event handling
	}

	private handleKeyDown(e: KeyboardEvent): void {
		// Keyboard events would target focused element
		// For now, just emit on view
	}

	private handleKeyUp(e: KeyboardEvent): void {
		// Keyboard events
	}

	// Utility Methods
	public getElementCount(): number {
		let count = 0;
		
		const countElement = (element: BaseElement): void => {
			count++;
			element.children.forEach(countElement);
		};
		
		countElement(this.rootElement);
		return count;
	}

	public getRenderStats() {
		return { ...this._renderStats };
	}

	public printLayoutTree(): void {
		this.layoutBinding.printLayoutTree();
	}

	// Cleanup
	public dispose(): void {
		// Unmount from DOM
		this.unmount();

		// Dispose root element (will cascade to children)
		this.rootElement.dispose();

		// Dispose layout system
		this.layoutBinding.dispose();

		// Dispose layers
		this.layerManager.dispose();

		// Remove all event listeners
		this.removeAllListeners();
	}
}