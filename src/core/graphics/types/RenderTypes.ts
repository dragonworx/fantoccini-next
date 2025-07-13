/**
 * Rendering pipeline type definitions.
 * 
 * @namespace core.graphics
 * @memberof core
 */

import type { BaseEventMap } from '../../event-emitter.js';
import type { Rectangle, Point, Viewport } from './GraphicsTypes.js';

// View Event Map
export interface ViewEventMap extends BaseEventMap {
	// Render Events
	'render:start': RenderEventData;
	'render:complete': RenderEventData;
	'render:layer': LayerRenderEventData;

	// Layout Events
	'layout:start': LayoutEventData;
	'layout:complete': LayoutEventData;
	'layout:invalidate': LayoutInvalidateEventData;

	// Viewport Events
	'viewport:change': ViewportChangeEventData;
	'viewport:resize': ViewportResizeEventData;

	// Interaction Events
	'interaction:start': InteractionStartEventData;
	'interaction:end': InteractionEndEventData;
}

// Event Data Types
export interface RenderEventData {
	frameId: number;
	timestamp: number;
	duration?: number;
	layersRendered: number;
	elementsRendered: number;
}

export interface LayerRenderEventData {
	layer: any; // Layer
	elementsRendered: number;
	duration: number;
}

export interface LayoutEventData {
	timestamp: number;
	duration?: number;
	elementsCalculated: number;
}

export interface LayoutInvalidateEventData {
	element: any; // BaseElement
	reason: string;
}

export interface ViewportChangeEventData {
	oldViewport: Viewport;
	newViewport: Viewport;
}

export interface ViewportResizeEventData {
	oldSize: { width: number; height: number };
	newSize: { width: number; height: number };
}

export interface InteractionStartEventData {
	type: string;
	position: Point;
	target: any; // BaseElement
}

export interface InteractionEndEventData {
	type: string;
	position: Point;
	target: any; // BaseElement
	duration: number;
}

// Render Context
export interface RenderContext {
	canvas: HTMLCanvasElement;
	context: CanvasRenderingContext2D;
	viewport: Viewport;
	pixelRatio: number;
	frameId: number;
	timestamp: number;
}

// Layer Types
export interface LayerData {
	id: string;
	canvas: HTMLCanvasElement;
	context: CanvasRenderingContext2D;
	elements: Set<any>; // Set<BaseElement>
	visible: boolean;
	opacity: number;
	offset: Point;
	blendMode: GlobalCompositeOperation;
	dirty: boolean;
	lastRenderTime: number;
}

// Render Tree
export interface RenderNode {
	element: any; // BaseElement
	children: RenderNode[];
	bounds: Rectangle;
	visible: boolean;
	opacity: number;
	zIndex: number;
	layer?: any; // Layer
}

// Performance Metrics
export interface RenderMetrics {
	frameTime: number;
	frameRate: number;
	elementsRendered: number;
	elementsSkipped: number;
	layersComposited: number;
	memoryUsage: number;
}

// Spatial Indexing
export interface SpatialIndex {
	insert(element: any, bounds: Rectangle): void;
	remove(element: any): void;
	query(point: Point): any[];
	query(bounds: Rectangle): any[];
	clear(): void;
}

// Hit Testing
export interface HitTestResult {
	element: any; // BaseElement
	localPoint: Point;
	distance: number;
}

// Object Picker
export interface ObjectPickerOptions {
	cellSize?: number;
	maxDepth?: number;
	sortByDepth?: boolean;
}

// Render Pipeline Options
export interface RenderPipelineOptions {
	enableViewportCulling?: boolean;
	enableDirtyFlagOptimization?: boolean;
	enableLayerCaching?: boolean;
	maxFrameTime?: number;
	targetFPS?: number;
}

// Layer Compositor Options
export interface LayerCompositorOptions {
	enableBlending?: boolean;
	enableFilters?: boolean;
	maxLayers?: number;
}

// Additional Types
export interface RenderOptions {
	clearCanvas?: boolean;
	enableClipping?: boolean;
	enableCaching?: boolean;
}

export interface RenderStats {
	frameTime: number;
	elementsRendered: number;
	drawCalls: number;
	memoryUsed: number;
}

export interface LayerCompositeOptions {
	blendMode?: GlobalCompositeOperation;
	opacity?: number;
	offset?: Point;
}