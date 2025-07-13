/**
 * Core graphics library type definitions.
 * 
 * @namespace core.graphics
 * @memberof core
 */

// Geometric Types
export interface Point {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface Rectangle extends Point, Size {}

export interface Transform2D {
	translateX: number;
	translateY: number;
	scaleX: number;
	scaleY: number;
	rotation: number;
	skewX: number;
	skewY: number;
}

// Color Types
export type Color = string | CanvasGradient | CanvasPattern;

export interface RGBA {
	r: number; // 0-255
	g: number; // 0-255
	b: number; // 0-255
	a: number; // 0-1
}

// Layout Types (moved to LayoutTypes.ts)

export interface Viewport extends Rectangle {
	scale: number;
}

// Event Types
export interface InteractionEvent {
	type: string;
	target: any; // Will be BaseElement when implemented
	currentTarget: any; // Will be BaseElement when implemented
	x: number;
	y: number;
	button?: number;
	buttons?: number;
	ctrlKey?: boolean;
	shiftKey?: boolean;
	altKey?: boolean;
	metaKey?: boolean;
}

// Options Types
export interface ViewOptions {
	pixelRatio?: number;
	backgroundColor?: Color;
	enableEvents?: boolean;
	optimizations?: {
		viewportCulling?: boolean;
		dirtyFlagOptimization?: boolean;
		objectPooling?: boolean;
	};
}

export interface ElementOptions {
	id?: string;
	layer?: any; // Will be Layer when implemented
	layoutProperties?: Partial<any>; // Will be LayoutProperties when implemented
	visualProperties?: Partial<any>; // Will be VisualProperties when implemented
}

export interface LayerOptions {
	visible?: boolean;
	opacity?: number;
	offset?: Point;
	blendMode?: GlobalCompositeOperation;
}

// Edge and Corner Values
export type EdgeValues = {
	top: number;
	right: number;
	bottom: number;
	left: number;
} | number;

export type CornerValues = {
	topLeft: number;
	topRight: number;
	bottomRight: number;
	bottomLeft: number;
} | number;

export type Percentage = {
	value: number;
	unit: '%';
};

// Utility Types
export interface RenderNode {
	element: any; // Will be BaseElement when implemented
	children: RenderNode[];
	bounds: Rectangle;
	transform?: Transform2D;
	opacity: number;
	visible: boolean;
}

export interface VisualProperties {
	visible: boolean;
	opacity: number;
	backgroundColor: Color | null;
	borderColor: Color | null;
	borderWidth: EdgeValues;
	borderRadius: CornerValues;
	transform: Transform2D;
}