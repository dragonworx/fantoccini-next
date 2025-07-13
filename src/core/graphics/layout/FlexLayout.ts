/**
 * Pure TypeScript flexbox layout engine.
 * 
 * @namespace core.graphics
 * @memberof core
 */

// Layout Types
export interface LayoutBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface LayoutSize {
	width: number;
	height: number;
}

export interface LayoutConstraints {
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
}

// Flexbox Properties
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
export type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
export type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
export type AlignSelf = 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
export type AlignContent = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around';

export interface LayoutStyle {
	// Size
	width?: number | 'auto';
	height?: number | 'auto';
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;

	// Spacing
	marginTop?: number;
	marginRight?: number;
	marginBottom?: number;
	marginLeft?: number;
	paddingTop?: number;
	paddingRight?: number;
	paddingBottom?: number;
	paddingLeft?: number;

	// Flexbox Container
	flexDirection?: FlexDirection;
	flexWrap?: FlexWrap;
	justifyContent?: JustifyContent;
	alignItems?: AlignItems;
	alignContent?: AlignContent;

	// Flexbox Item
	flexGrow?: number;
	flexShrink?: number;
	flexBasis?: number | 'auto';
	alignSelf?: AlignSelf;

	// Position
	position?: 'relative' | 'absolute';
	top?: number;
	right?: number;
	bottom?: number;
	left?: number;
}

// Computed values after layout
export interface ComputedLayout extends LayoutBox {
	marginTop: number;
	marginRight: number;
	marginBottom: number;
	marginLeft: number;
	paddingTop: number;
	paddingRight: number;
	paddingBottom: number;
	paddingLeft: number;
	borderTop: number;
	borderRight: number;
	borderBottom: number;
	borderLeft: number;
}

// Measure function for intrinsic sizing
export type MeasureFunction = (width: number, height: number) => LayoutSize;

/**
 * A layout node in the flexbox hierarchy.
 */
export class LayoutNode {
	public style: LayoutStyle = {};
	public children: LayoutNode[] = [];
	public parent: LayoutNode | null = null;
	public computedLayout: ComputedLayout;
	public measureFunction: MeasureFunction | null = null;

	// Internal state
	private _isDirty = true;
	private _hasNewLayout = false;
	private _cachedLayout: ComputedLayout | null = null;

	// User data for binding to view elements
	public userData: any = null;

	constructor(style: LayoutStyle = {}) {
		this.style = { ...style };
		this.computedLayout = this.createEmptyLayout();
	}

	private createEmptyLayout(): ComputedLayout {
		return {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			marginTop: 0,
			marginRight: 0,
			marginBottom: 0,
			marginLeft: 0,
			paddingTop: 0,
			paddingRight: 0,
			paddingBottom: 0,
			paddingLeft: 0,
			borderTop: 0,
			borderRight: 0,
			borderBottom: 0,
			borderLeft: 0
		};
	}

	// Tree management
	appendChild(child: LayoutNode): void {
		this.insertChild(child, this.children.length);
	}

	insertChild(child: LayoutNode, index: number): void {
		// Remove from previous parent
		if (child.parent) {
			child.parent.removeChild(child);
		}

		// Insert at specified index
		const clampedIndex = Math.max(0, Math.min(index, this.children.length));
		this.children.splice(clampedIndex, 0, child);
		child.parent = this;
		
		this.markDirty();
	}

	removeChild(child: LayoutNode): void {
		const index = this.children.indexOf(child);
		if (index !== -1) {
			this.children.splice(index, 1);
			child.parent = null;
			this.markDirty();
		}
	}

	// Style management
	setStyle(style: Partial<LayoutStyle>): void {
		Object.assign(this.style, style);
		this.markDirty();
	}

	// Dirty flag management
	markDirty(): void {
		if (this._isDirty) return;
		
		this._isDirty = true;
		this._hasNewLayout = false;
		this._cachedLayout = null;

		// Mark parent dirty too
		if (this.parent) {
			this.parent.markDirty();
		}
	}

	isDirty(): boolean {
		return this._isDirty;
	}

	hasNewLayout(): boolean {
		return this._hasNewLayout;
	}

	markLayoutClean(): void {
		this._hasNewLayout = false;
	}

	// Measure function
	setMeasureFunction(measureFunc: MeasureFunction | null): void {
		this.measureFunction = measureFunc;
		this.markDirty();
	}

	// Layout calculation
	calculateLayout(parentWidth?: number, parentHeight?: number): void {
		if (!this._isDirty && this._cachedLayout) {
			this.computedLayout = { ...this._cachedLayout };
			return;
		}

		const availableWidth = parentWidth ?? 0;
		const availableHeight = parentHeight ?? 0;

		// Perform layout calculation
		this.performLayout(availableWidth, availableHeight);

		// Cache the result
		this._cachedLayout = { ...this.computedLayout };
		this._isDirty = false;
		this._hasNewLayout = true;

		// Calculate layout for children
		this.children.forEach(child => {
			child.calculateLayout(this.computedLayout.width, this.computedLayout.height);
		});
	}

	private performLayout(availableWidth: number, availableHeight: number): void {
		// Reset computed layout
		this.computedLayout = this.createEmptyLayout();

		// Apply spacing values
		this.computedLayout.marginTop = this.style.marginTop ?? 0;
		this.computedLayout.marginRight = this.style.marginRight ?? 0;
		this.computedLayout.marginBottom = this.style.marginBottom ?? 0;
		this.computedLayout.marginLeft = this.style.marginLeft ?? 0;
		this.computedLayout.paddingTop = this.style.paddingTop ?? 0;
		this.computedLayout.paddingRight = this.style.paddingRight ?? 0;
		this.computedLayout.paddingBottom = this.style.paddingBottom ?? 0;
		this.computedLayout.paddingLeft = this.style.paddingLeft ?? 0;

		// Calculate node size
		this.calculateNodeSize(availableWidth, availableHeight);

		// Layout children if any
		if (this.children.length > 0) {
			this.layoutChildren();
		}
	}

	private calculateNodeSize(availableWidth: number, availableHeight: number): void {
		let width = 0;
		let height = 0;

		// Use measure function if available
		if (this.measureFunction && this.children.length === 0) {
			const measured = this.measureFunction(availableWidth, availableHeight);
			width = measured.width;
			height = measured.height;
		} else {
			// Calculate based on style
			if (typeof this.style.width === 'number') {
				width = this.style.width;
			} else if (this.style.width === 'auto' || this.style.width === undefined) {
				width = availableWidth;
			}

			if (typeof this.style.height === 'number') {
				height = this.style.height;
			} else if (this.style.height === 'auto' || this.style.height === undefined) {
				height = availableHeight;
			}
		}

		// Apply constraints
		if (this.style.minWidth !== undefined) {
			width = Math.max(width, this.style.minWidth);
		}
		if (this.style.maxWidth !== undefined) {
			width = Math.min(width, this.style.maxWidth);
		}
		if (this.style.minHeight !== undefined) {
			height = Math.max(height, this.style.minHeight);
		}
		if (this.style.maxHeight !== undefined) {
			height = Math.min(height, this.style.maxHeight);
		}

		this.computedLayout.width = width;
		this.computedLayout.height = height;
	}

	private layoutChildren(): void {
		const direction = this.style.flexDirection ?? 'row';
		const wrap = this.style.flexWrap ?? 'nowrap';
		const justifyContent = this.style.justifyContent ?? 'flex-start';
		const alignItems = this.style.alignItems ?? 'stretch';

		const isRow = direction === 'row' || direction === 'row-reverse';
		const isReverse = direction === 'row-reverse' || direction === 'column-reverse';

		// Available space for children
		const contentWidth = this.computedLayout.width - this.computedLayout.paddingLeft - this.computedLayout.paddingRight;
		const contentHeight = this.computedLayout.height - this.computedLayout.paddingTop - this.computedLayout.paddingBottom;

		// Calculate child sizes first
		this.children.forEach(child => {
			child.calculateNodeSize(
				isRow ? contentWidth : contentWidth,
				isRow ? contentHeight : contentHeight
			);
		});

		// Flexbox algorithm
		this.flexLayout(isRow, isReverse, contentWidth, contentHeight, justifyContent, alignItems);
	}

	private flexLayout(
		isRow: boolean,
		isReverse: boolean,
		containerWidth: number,
		containerHeight: number,
		justifyContent: JustifyContent,
		alignItems: AlignItems
	): void {
		const mainAxisSize = isRow ? containerWidth : containerHeight;
		const crossAxisSize = isRow ? containerHeight : containerWidth;

		// Calculate flex grow/shrink
		let totalFlexGrow = 0;
		let totalFlexShrink = 0;
		let totalMainSize = 0;

		this.children.forEach(child => {
			const flexGrow = child.style.flexGrow ?? 0;
			const flexShrink = child.style.flexShrink ?? 1;
			const mainSize = isRow ? child.computedLayout.width : child.computedLayout.height;

			totalFlexGrow += flexGrow;
			totalFlexShrink += flexShrink;
			totalMainSize += mainSize;
		});

		// Distribute free space
		const freeSpace = mainAxisSize - totalMainSize;
		let flexGrowSpace = 0;
		let flexShrinkSpace = 0;

		if (freeSpace > 0 && totalFlexGrow > 0) {
			flexGrowSpace = freeSpace / totalFlexGrow;
		} else if (freeSpace < 0 && totalFlexShrink > 0) {
			flexShrinkSpace = freeSpace / totalFlexShrink;
		}

		// Apply flex grow/shrink
		this.children.forEach(child => {
			const flexGrow = child.style.flexGrow ?? 0;
			const flexShrink = child.style.flexShrink ?? 1;

			if (flexGrowSpace > 0 && flexGrow > 0) {
				const extraSize = flexGrow * flexGrowSpace;
				if (isRow) {
					child.computedLayout.width += extraSize;
				} else {
					child.computedLayout.height += extraSize;
				}
			} else if (flexShrinkSpace < 0 && flexShrink > 0) {
				const reduceSize = flexShrink * Math.abs(flexShrinkSpace);
				if (isRow) {
					child.computedLayout.width = Math.max(0, child.computedLayout.width - reduceSize);
				} else {
					child.computedLayout.height = Math.max(0, child.computedLayout.height - reduceSize);
				}
			}
		});

		// Position children
		this.positionChildren(isRow, isReverse, containerWidth, containerHeight, justifyContent, alignItems);
	}

	private positionChildren(
		isRow: boolean,
		isReverse: boolean,
		containerWidth: number,
		containerHeight: number,
		justifyContent: JustifyContent,
		alignItems: AlignItems
	): void {
		const children = isReverse ? [...this.children].reverse() : this.children;
		
		let mainAxisOffset = this.computedLayout.paddingLeft;
		let crossAxisOffset = this.computedLayout.paddingTop;

		// Calculate main axis positioning
		const totalMainSize = children.reduce((sum, child) => {
			return sum + (isRow ? child.computedLayout.width : child.computedLayout.height);
		}, 0);

		const remainingSpace = (isRow ? containerWidth : containerHeight) - totalMainSize;

		switch (justifyContent) {
			case 'center':
				mainAxisOffset += remainingSpace / 2;
				break;
			case 'flex-end':
				mainAxisOffset += remainingSpace;
				break;
			case 'space-between':
				// Space will be distributed between children
				break;
			case 'space-around':
				mainAxisOffset += remainingSpace / (children.length * 2);
				break;
			case 'space-evenly':
				mainAxisOffset += remainingSpace / (children.length + 1);
				break;
		}

		// Position each child
		children.forEach((child, index) => {
			// Main axis position
			if (isRow) {
				child.computedLayout.x = mainAxisOffset;
				mainAxisOffset += child.computedLayout.width;
			} else {
				child.computedLayout.y = mainAxisOffset;
				mainAxisOffset += child.computedLayout.height;
			}

			// Cross axis position
			const childAlignSelf = child.style.alignSelf ?? alignItems;
			const crossAxisPosition = this.calculateCrossAxisPosition(
				child,
				isRow,
				containerWidth,
				containerHeight,
				childAlignSelf
			);

			if (isRow) {
				child.computedLayout.y = crossAxisPosition;
			} else {
				child.computedLayout.x = crossAxisPosition;
			}

			// Add spacing for space-between, space-around, space-evenly
			if (justifyContent === 'space-between' && index < children.length - 1) {
				const spacing = remainingSpace / (children.length - 1);
				mainAxisOffset += spacing;
			} else if (justifyContent === 'space-around') {
				const spacing = remainingSpace / children.length;
				mainAxisOffset += spacing;
			} else if (justifyContent === 'space-evenly') {
				const spacing = remainingSpace / (children.length + 1);
				mainAxisOffset += spacing;
			}
		});
	}

	private calculateCrossAxisPosition(
		child: LayoutNode,
		isRow: boolean,
		containerWidth: number,
		containerHeight: number,
		align: AlignItems | AlignSelf
	): number {
		const containerCrossSize = isRow ? containerHeight : containerWidth;
		const childCrossSize = isRow ? child.computedLayout.height : child.computedLayout.width;
		const paddingStart = isRow ? this.computedLayout.paddingTop : this.computedLayout.paddingLeft;

		switch (align) {
			case 'flex-start':
				return paddingStart;
			case 'flex-end':
				return paddingStart + containerCrossSize - childCrossSize;
			case 'center':
				return paddingStart + (containerCrossSize - childCrossSize) / 2;
			case 'stretch':
				// Stretch the child to fill cross axis
				if (isRow) {
					child.computedLayout.height = containerCrossSize;
				} else {
					child.computedLayout.width = containerCrossSize;
				}
				return paddingStart;
			case 'baseline':
				// For now, treat as flex-start
				return paddingStart;
			default:
				return paddingStart;
		}
	}

	// Helper methods
	getLayoutBox(): LayoutBox {
		return {
			x: this.computedLayout.x,
			y: this.computedLayout.y,
			width: this.computedLayout.width,
			height: this.computedLayout.height
		};
	}

	// Tree traversal
	traversePreOrder(callback: (node: LayoutNode) => void): void {
		callback(this);
		this.children.forEach(child => child.traversePreOrder(callback));
	}

	traversePostOrder(callback: (node: LayoutNode) => void): void {
		this.children.forEach(child => child.traversePostOrder(callback));
		callback(this);
	}
}

/**
 * Layout engine that manages the root layout tree.
 */
export class FlexLayoutEngine {
	public readonly root: LayoutNode;
	private _needsLayout = false;

	constructor() {
		this.root = new LayoutNode({
			width: 'auto',
			height: 'auto',
			flexDirection: 'column'
		});
	}

	// Layout calculation
	calculateLayout(width?: number, height?: number): void {
		this.root.calculateLayout(width, height);
		this._needsLayout = false;
	}

	needsLayout(): boolean {
		return this._needsLayout || this.root.isDirty();
	}

	markNeedsLayout(): void {
		this._needsLayout = true;
		this.root.markDirty();
	}

	// Node creation
	createNode(style: LayoutStyle = {}): LayoutNode {
		return new LayoutNode(style);
	}

	// Tree operations
	appendChild(parent: LayoutNode, child: LayoutNode): void {
		parent.appendChild(child);
		this.markNeedsLayout();
	}

	insertChild(parent: LayoutNode, child: LayoutNode, index: number): void {
		parent.insertChild(child, index);
		this.markNeedsLayout();
	}

	removeChild(parent: LayoutNode, child: LayoutNode): void {
		parent.removeChild(child);
		this.markNeedsLayout();
	}

	// Utility methods
	findNodeByUserData(userData: any): LayoutNode | null {
		let found: LayoutNode | null = null;
		
		this.root.traversePreOrder(node => {
			if (node.userData === userData) {
				found = node;
			}
		});

		return found;
	}

	getAllDirtyNodes(): LayoutNode[] {
		const dirtyNodes: LayoutNode[] = [];
		
		this.root.traversePreOrder(node => {
			if (node.isDirty()) {
				dirtyNodes.push(node);
			}
		});

		return dirtyNodes;
	}

	getAllNodesWithNewLayout(): LayoutNode[] {
		const newLayoutNodes: LayoutNode[] = [];
		
		this.root.traversePreOrder(node => {
			if (node.hasNewLayout()) {
				newLayoutNodes.push(node);
			}
		});

		return newLayoutNodes;
	}

	// Debug helpers
	printTree(node: LayoutNode = this.root, indent: string = ''): void {
		const layout = node.getLayoutBox();
		console.log(`${indent}Node: ${layout.x},${layout.y} ${layout.width}x${layout.height}`);
		
		node.children.forEach((child, index) => {
			const isLast = index === node.children.length - 1;
			this.printTree(child, indent + (isLast ? '└── ' : '├── '));
		});
	}
}