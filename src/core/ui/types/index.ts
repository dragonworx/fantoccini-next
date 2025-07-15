/**
 * Core type definitions for the UI library
 * @namespace core.ui
 * @memberof core.ui
 */

import type { Container } from '../elements/container';

/**
 * Bitwise flags for tracking element state changes
 * @memberof core.ui
 */
export enum DirtyFlags {
	None = 0,
	Geometry = 1 << 0,    // Position or size changed
	Appearance = 1 << 1,  // Visual properties changed
	Layout = 1 << 2,      // Children or layout properties changed
	Content = 1 << 3,     // Text or other content changed
	Transform = 1 << 4,   // Three.js transform needs update
	All = Geometry | Appearance | Layout | Content | Transform
}

/**
 * Geometry interface for element positioning and sizing
 * @memberof core.ui
 */
export interface IGeometry {
	left: number;
	top: number;
	width: number;
	height: number;
}

/**
 * Appearance interface for element visual styling
 * @memberof core.ui
 */
export interface IAppearance {
	alpha: number;
	backgroundColor: number;
	borderColor: number;
	borderWidth: number;
	borderRadius: number;
	shadowColor?: number;
	shadowBlur?: number;
	shadowOffsetX?: number;
	shadowOffsetY?: number;
}

/**
 * Layout interface for element layout properties
 * @memberof core.ui
 */
export interface ILayout {
	paddingLeft: number;
	paddingRight: number;
	paddingTop: number;
	paddingBottom: number;
	marginLeft: number;
	marginRight: number;
	marginTop: number;
	marginBottom: number;
	hAlign: 'left' | 'center' | 'right';
	vAlign: 'top' | 'middle' | 'bottom';
}

/**
 * Element configuration interface
 * @memberof core.ui
 */
export interface IElementConfig {
	id?: string;
	visible?: boolean;
	interactive?: boolean;
	geometry?: Partial<IGeometry>;
	appearance?: Partial<IAppearance>;
	layout?: Partial<ILayout>;
	// Shorthand properties
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	backgroundColor?: string | number;
	alpha?: number;
	opacity?: number;
}

/**
 * Container configuration interface
 * @memberof core.ui
 */
export interface IContainerConfig extends IElementConfig {
	layoutManager?: ILayoutManager;
	layout?: ILayoutManager;  // Alias for layoutManager
	padding?: number | [number, number] | [number, number, number, number];
	gap?: number;
}

/**
 * Layout manager interface
 * @memberof core.ui
 */
export interface ILayoutManager {
	name: string;
	calculateLayout(container: Container): void;
}

/**
 * View configuration interface
 * @memberof core.ui
 */
export interface IViewConfig {
	canvas?: HTMLCanvasElement;
	width?: number;
	height?: number;
	pixelRatio?: number;
	autoRender?: boolean;
}

/**
 * Text style interface
 * @memberof core.ui
 */
export interface ITextStyle {
	fontFamily: string;
	fontSize: number;
	fontWeight: string;
	fontStyle: string;
	color: number;
	textAlign: 'left' | 'center' | 'right' | 'justify';
	lineHeight: number;
	letterSpacing: number;
	maxLines?: number;
	overflow: 'visible' | 'hidden' | 'ellipsis';
}

/**
 * Bounds interface for element bounds
 * @memberof core.ui
 */
export interface IBounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

// Re-export common config types with shorter names
export type ElementConfig = IElementConfig;
export type ContainerConfig = IContainerConfig;
export type ViewConfig = IViewConfig;

// Flex layout types
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexJustify = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
export type FlexAlign = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';