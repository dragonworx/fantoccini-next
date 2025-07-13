/**
 * Element-specific type definitions.
 * 
 * @namespace core.graphics
 * @memberof core
 */

import type { BaseEventMap } from '../../event-emitter.js';
import type { Color, Point, Rectangle, Transform2D, EdgeValues, CornerValues } from './GraphicsTypes.js';
import type { LayoutProperties } from './LayoutTypes.js';

// Element Event Map
export interface ElementEventMap extends BaseEventMap {
	// Mouse Events
	'mousedown': MouseEventData;
	'mouseup': MouseEventData;
	'mousemove': MouseEventData;
	'mouseenter': MouseEventData;
	'mouseleave': MouseEventData;
	'mouseover': MouseEventData;
	'mouseout': MouseEventData;
	'click': MouseEventData;
	'dblclick': MouseEventData;
	'contextmenu': MouseEventData;
	'wheel': WheelEventData;

	// Touch Events
	'touchstart': TouchEventData;
	'touchmove': TouchEventData;
	'touchend': TouchEventData;
	'touchcancel': TouchEventData;

	// Keyboard Events
	'keydown': KeyboardEventData;
	'keyup': KeyboardEventData;
	'keypress': KeyboardEventData;

	// Focus Events
	'focus': FocusEventData;
	'blur': FocusEventData;
	'focusin': FocusEventData;
	'focusout': FocusEventData;

	// Layout Events
	'layout:change': LayoutChangeEventData;
	'layout:complete': LayoutCompleteEventData;

	// Hierarchy Events
	'child:added': ChildEventData;
	'child:removed': ChildEventData;
	'parent:changed': ParentChangeEventData;

	// Visibility Events
	'visibility:change': VisibilityEventData;
	'viewport:enter': ViewportEventData;
	'viewport:exit': ViewportEventData;
}

// Event Data Types
export interface MouseEventData {
	x: number;
	y: number;
	button: number;
	buttons: number;
	ctrlKey: boolean;
	shiftKey: boolean;
	altKey: boolean;
	metaKey: boolean;
	target: any; // BaseElement
	currentTarget: any; // BaseElement
}

export interface WheelEventData extends MouseEventData {
	deltaX: number;
	deltaY: number;
	deltaZ: number;
	deltaMode: number;
}

export interface TouchEventData {
	touches: Touch[];
	targetTouches: Touch[];
	changedTouches: Touch[];
	target: any; // BaseElement
	currentTarget: any; // BaseElement
}

export interface KeyboardEventData {
	key: string;
	code: string;
	ctrlKey: boolean;
	shiftKey: boolean;
	altKey: boolean;
	metaKey: boolean;
	repeat: boolean;
	target: any; // BaseElement
	currentTarget: any; // BaseElement
}

export interface FocusEventData {
	target: any; // BaseElement
	relatedTarget: any; // BaseElement | null
}

export interface LayoutChangeEventData {
	element: any; // BaseElement
	oldLayout: Rectangle;
	newLayout: Rectangle;
}

export interface LayoutCompleteEventData {
	element: any; // BaseElement
	duration: number;
}

export interface ChildEventData {
	parent: any; // BaseElement
	child: any; // BaseElement
	index: number;
}

export interface ParentChangeEventData {
	element: any; // BaseElement
	oldParent: any; // BaseElement | null
	newParent: any; // BaseElement | null
}

export interface VisibilityEventData {
	element: any; // BaseElement
	visible: boolean;
}

export interface ViewportEventData {
	element: any; // BaseElement
	viewport: Rectangle;
}

// Element Options
export interface ElementOptions {
	id?: string;
	layer?: any; // Will be Layer when implemented
	layoutProperties?: Partial<any>; // Will be LayoutProperties when implemented
	visualProperties?: Partial<any>; // Will be VisualProperties when implemented
}

export interface BaseElementOptions {
	id?: string;
	visible?: boolean;
	opacity?: number;
	backgroundColor?: Color;
	borderColor?: Color;
	borderWidth?: EdgeValues;
	borderRadius?: CornerValues;
	transform?: Partial<Transform2D>;
	layoutProperties?: Partial<LayoutProperties>;
}

export interface BoxElementOptions extends BaseElementOptions {
	content?: string | HTMLImageElement;
	textAlign?: 'left' | 'center' | 'right';
	fontSize?: number;
	fontFamily?: string;
	fontWeight?: 'normal' | 'bold' | number;
	textColor?: Color;
}

// Element State
export interface ElementState {
	dirty: boolean;
	layoutDirty: boolean;
	renderDirty: boolean;
	visible: boolean;
	opacity: number;
	transform: Transform2D;
	computedBounds: Rectangle;
	absoluteBounds: Rectangle;
}

// Computed Properties
export interface ComputedStyle {
	backgroundColor: Color | null;
	borderColor: Color | null;
	borderWidth: EdgeValues;
	borderRadius: CornerValues;
	opacity: number;
	transform: Transform2D;
}

// Element Constructor Type
export interface ElementConstructor<T = any> {
	new (view: any, options?: any): T;
}