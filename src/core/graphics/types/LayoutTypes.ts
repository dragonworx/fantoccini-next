/**
 * Layout system type definitions for Yoga integration.
 * 
 * @namespace core.graphics
 * @memberof core
 */

import type { EdgeValues, CornerValues, Percentage } from './GraphicsTypes.js';

// Layout result interface
export interface LayoutResult {
	x: number;
	y: number;
	width: number;
	height: number;
}

// Layout Properties (mirror Yoga flex properties)
export interface LayoutProperties {
	// Size
	width: number | 'auto' | Percentage;
	height: number | 'auto' | Percentage;
	minWidth: number;
	minHeight: number;
	maxWidth: number;
	maxHeight: number;

	// Spacing
	margin: EdgeValues;
	marginTop: number;
	marginRight: number;
	marginBottom: number;
	marginLeft: number;
	padding: EdgeValues;
	paddingTop: number;
	paddingRight: number;
	paddingBottom: number;
	paddingLeft: number;

	// Position
	position: 'relative' | 'absolute';
	top: number | 'auto' | Percentage;
	right: number | 'auto' | Percentage;
	bottom: number | 'auto' | Percentage;
	left: number | 'auto' | Percentage;

	// Flexbox
	flexDirection: 'row' | 'column' | 'row-reverse' | 'column-reverse';
	flexWrap: 'nowrap' | 'wrap' | 'wrap-reverse';
	justifyContent: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
	alignItems: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
	alignSelf: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
	alignContent: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around';

	// Flex Item
	flexGrow: number;
	flexShrink: number;
	flexBasis: number | 'auto' | Percentage;

	// Aspect Ratio
	aspectRatio: number | 'auto';
}

// Yoga-specific types
export type JustifyContent = LayoutProperties['justifyContent'];
export type AlignItems = LayoutProperties['alignItems'];
export type FlexWrap = LayoutProperties['flexWrap'];

// Mock Yoga types (will be replaced with actual Yoga when integrated)
export interface YogaNode {
	setWidth(width: number | string): void;
	setHeight(height: number | string): void;
	setMargin(edge: YogaEdge, value: number): void;
	setPadding(edge: YogaEdge, value: number): void;
	setPosition(edge: YogaEdge, value: number): void;
	setPositionType(positionType: YogaPositionType): void;
	setFlexDirection(flexDirection: YogaFlexDirection): void;
	setFlexWrap(flexWrap: YogaFlexWrap): void;
	setJustifyContent(justifyContent: YogaJustifyContent): void;
	setAlignItems(alignItems: YogaAlign): void;
	setAlignSelf(alignSelf: YogaAlign): void;
	setAlignContent(alignContent: YogaAlign): void;
	setFlexGrow(flexGrow: number): void;
	setFlexShrink(flexShrink: number): void;
	setFlexBasis(flexBasis: number | string): void;
	setAspectRatio(aspectRatio: number): void;
	setMeasureFunc(measureFunc: YogaMeasureFunc | null): void;
	insertChild(child: YogaNode, index: number): void;
	removeChild(child: YogaNode): void;
	getChildCount(): number;
	getChild(index: number): YogaNode;
	getComputedLayout(): YogaLayout;
	calculateLayout(width?: number, height?: number): void;
	markDirty(): void;
	isDirty(): boolean;
	free(): void;
}

export interface YogaConfig {
	create(): YogaNode;
	destroy(): void;
}

export interface YogaLayout {
	left: number;
	top: number;
	width: number;
	height: number;
}

export interface YogaSize {
	width: number;
	height: number;
}

export enum YogaEdge {
	Left = 0,
	Top = 1,
	Right = 2,
	Bottom = 3,
	Start = 4,
	End = 5,
	Horizontal = 6,
	Vertical = 7,
	All = 8,
}

export enum YogaPositionType {
	Static = 0,
	Relative = 1,
	Absolute = 2,
}

export enum YogaFlexDirection {
	Column = 0,
	ColumnReverse = 1,
	Row = 2,
	RowReverse = 3,
}

export enum YogaFlexWrap {
	NoWrap = 0,
	Wrap = 1,
	WrapReverse = 2,
}

export enum YogaJustifyContent {
	FlexStart = 0,
	Center = 1,
	FlexEnd = 2,
	SpaceBetween = 3,
	SpaceAround = 4,
	SpaceEvenly = 5,
}

export enum YogaAlign {
	Auto = 0,
	FlexStart = 1,
	Center = 2,
	FlexEnd = 3,
	Stretch = 4,
	Baseline = 5,
	SpaceBetween = 6,
	SpaceAround = 7,
}

export enum YogaMeasureMode {
	Undefined = 0,
	Exactly = 1,
	AtMost = 2,
}

export type YogaMeasureFunc = (
	width: number,
	widthMeasureMode: YogaMeasureMode,
	height: number,
	heightMeasureMode: YogaMeasureMode
) => YogaSize;