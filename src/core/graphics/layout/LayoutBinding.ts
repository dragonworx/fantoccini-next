/**
 * Layout binding system for connecting layout nodes with view elements.
 * 
 * @namespace core.graphics
 * @memberof core
 */

import { FlexLayoutEngine, LayoutNode, LayoutStyle } from './FlexLayout.js';
import type { BaseElement } from '../elements/BaseElement.js';

/**
 * Manages the binding between layout nodes and view elements.
 */
export class LayoutBinding {
	private layoutEngine: FlexLayoutEngine;
	private elementToNode = new WeakMap<BaseElement, LayoutNode>();
	private nodeToElement = new WeakMap<LayoutNode, BaseElement>();

	constructor() {
		this.layoutEngine = new FlexLayoutEngine();
	}

	// Binding management
	bindElement(element: BaseElement, style: LayoutStyle = {}): LayoutNode {
		// Create or get existing layout node
		let node = this.elementToNode.get(element);
		
		if (!node) {
			node = this.layoutEngine.createNode(style);
			
			// Set up bidirectional mapping
			this.elementToNode.set(element, node);
			this.nodeToElement.set(node, element);
			
			// Store element reference in node's userData
			node.userData = element;
		} else {
			// Update existing node style
			node.setStyle(style);
		}

		return node;
	}

	unbindElement(element: BaseElement): void {
		const node = this.elementToNode.get(element);
		if (node) {
			// Remove from parent if attached
			if (node.parent) {
				node.parent.removeChild(node);
			}
			
			// Clear mappings
			this.elementToNode.delete(element);
			this.nodeToElement.delete(node);
			node.userData = null;
		}
	}

	getLayoutNode(element: BaseElement): LayoutNode | null {
		return this.elementToNode.get(element) || null;
	}

	getElement(node: LayoutNode): BaseElement | null {
		return this.nodeToElement.get(node) || null;
	}

	// Hierarchy synchronization
	syncElementHierarchy(element: BaseElement): void {
		const node = this.getLayoutNode(element);
		if (!node) return;

		// Build set of expected child nodes
		const expectedChildren = new Set<LayoutNode>();
		element.children.forEach(child => {
			const childNode = this.getLayoutNode(child);
			if (childNode) {
				expectedChildren.add(childNode);
			}
		});

		// Build set of current child nodes
		const currentChildren = new Set(node.children);

		// Remove nodes that shouldn't be children
		currentChildren.forEach(childNode => {
			if (!expectedChildren.has(childNode)) {
				node.removeChild(childNode);
			}
		});

		// Add missing child nodes in correct order
		element.children.forEach((child, index) => {
			const childNode = this.getLayoutNode(child);
			if (childNode && !currentChildren.has(childNode)) {
				node.insertChild(childNode, index);
			}
		});

		// Recursively sync children
		element.children.forEach(child => {
			this.syncElementHierarchy(child);
		});
	}

	// Layout calculation
	calculateLayout(width?: number, height?: number): void {
		this.layoutEngine.calculateLayout(width, height);
	}

	needsLayout(): boolean {
		return this.layoutEngine.needsLayout();
	}

	// Apply layout results to elements
	applyLayoutToElements(): void {
		const nodesWithNewLayout = this.layoutEngine.getAllNodesWithNewLayout();
		
		nodesWithNewLayout.forEach(node => {
			const element = this.getElement(node);
			if (element) {
				const layout = node.getLayoutBox();
				
				// Apply layout to element
				element.setLayoutResult({
					x: layout.x,
					y: layout.y,
					width: layout.width,
					height: layout.height
				});
			}
			
			// Mark layout as processed
			node.markLayoutClean();
		});
	}

	// Convenience methods for common operations
	setElementStyle(element: BaseElement, style: Partial<LayoutStyle>): void {
		const node = this.getLayoutNode(element);
		if (node) {
			node.setStyle(style);
		}
	}

	getElementLayout(element: BaseElement) {
		const node = this.getLayoutNode(element);
		return node ? node.getLayoutBox() : null;
	}

	// Root element management
	setRootElement(element: BaseElement, style: LayoutStyle = {}): void {
		// Bind root element to root layout node
		this.elementToNode.set(element, this.layoutEngine.root);
		this.nodeToElement.set(this.layoutEngine.root, element);
		this.layoutEngine.root.userData = element;
		
		// Apply style to root
		this.layoutEngine.root.setStyle(style);
	}

	getRootNode(): LayoutNode {
		return this.layoutEngine.root;
	}

	// Debug helpers
	printLayoutTree(): void {
		console.log('Layout Tree:');
		this.layoutEngine.printTree();
	}

	// Cleanup
	dispose(): void {
		// WeakMaps don't have clear() method, they automatically garbage collect
		// when references are removed. We'll create new instances instead.
		this.elementToNode = new WeakMap();
		this.nodeToElement = new WeakMap();
		this.rootNode = null;
	}
}

/**
 * Helper class for managing layout properties with type safety.
 */
export class LayoutPropertyManager {
	private binding: LayoutBinding;

	constructor(binding: LayoutBinding) {
		this.binding = binding;
	}

	// Size properties
	setSize(element: BaseElement, width: number | 'auto', height: number | 'auto'): void {
		this.binding.setElementStyle(element, { width, height });
	}

	setWidth(element: BaseElement, width: number | 'auto'): void {
		this.binding.setElementStyle(element, { width });
	}

	setHeight(element: BaseElement, height: number | 'auto'): void {
		this.binding.setElementStyle(element, { height });
	}

	setConstraints(element: BaseElement, constraints: {
		minWidth?: number;
		maxWidth?: number;
		minHeight?: number;
		maxHeight?: number;
	}): void {
		this.binding.setElementStyle(element, constraints);
	}

	// Margin properties
	setMargin(element: BaseElement, margin: number): void;
	setMargin(element: BaseElement, vertical: number, horizontal: number): void;
	setMargin(element: BaseElement, top: number, right: number, bottom: number, left: number): void;
	setMargin(element: BaseElement, ...args: number[]): void {
		if (args.length === 1) {
			const [all] = args;
			this.binding.setElementStyle(element, {
				marginTop: all,
				marginRight: all,
				marginBottom: all,
				marginLeft: all
			});
		} else if (args.length === 2) {
			const [vertical, horizontal] = args;
			this.binding.setElementStyle(element, {
				marginTop: vertical,
				marginRight: horizontal,
				marginBottom: vertical,
				marginLeft: horizontal
			});
		} else if (args.length === 4) {
			const [top, right, bottom, left] = args;
			this.binding.setElementStyle(element, {
				marginTop: top,
				marginRight: right,
				marginBottom: bottom,
				marginLeft: left
			});
		}
	}

	// Padding properties
	setPadding(element: BaseElement, padding: number): void;
	setPadding(element: BaseElement, vertical: number, horizontal: number): void;
	setPadding(element: BaseElement, top: number, right: number, bottom: number, left: number): void;
	setPadding(element: BaseElement, ...args: number[]): void {
		if (args.length === 1) {
			const [all] = args;
			this.binding.setElementStyle(element, {
				paddingTop: all,
				paddingRight: all,
				paddingBottom: all,
				paddingLeft: all
			});
		} else if (args.length === 2) {
			const [vertical, horizontal] = args;
			this.binding.setElementStyle(element, {
				paddingTop: vertical,
				paddingRight: horizontal,
				paddingBottom: vertical,
				paddingLeft: horizontal
			});
		} else if (args.length === 4) {
			const [top, right, bottom, left] = args;
			this.binding.setElementStyle(element, {
				paddingTop: top,
				paddingRight: right,
				paddingBottom: bottom,
				paddingLeft: left
			});
		}
	}

	// Flexbox container properties
	setFlexContainer(element: BaseElement, options: {
		direction?: LayoutStyle['flexDirection'];
		wrap?: LayoutStyle['flexWrap'];
		justifyContent?: LayoutStyle['justifyContent'];
		alignItems?: LayoutStyle['alignItems'];
		alignContent?: LayoutStyle['alignContent'];
	}): void {
		this.binding.setElementStyle(element, {
			flexDirection: options.direction,
			flexWrap: options.wrap,
			justifyContent: options.justifyContent,
			alignItems: options.alignItems,
			alignContent: options.alignContent
		});
	}

	// Flexbox item properties
	setFlexItem(element: BaseElement, options: {
		grow?: number;
		shrink?: number;
		basis?: number | 'auto';
		alignSelf?: LayoutStyle['alignSelf'];
	}): void {
		this.binding.setElementStyle(element, {
			flexGrow: options.grow,
			flexShrink: options.shrink,
			flexBasis: options.basis,
			alignSelf: options.alignSelf
		});
	}

	// Convenience methods
	makeFlexRow(element: BaseElement): void {
		this.binding.setElementStyle(element, { flexDirection: 'row' });
	}

	makeFlexColumn(element: BaseElement): void {
		this.binding.setElementStyle(element, { flexDirection: 'column' });
	}

	centerContent(element: BaseElement): void {
		this.binding.setElementStyle(element, {
			justifyContent: 'center',
			alignItems: 'center'
		});
	}

	fillSpace(element: BaseElement): void {
		this.binding.setElementStyle(element, { flexGrow: 1 });
	}

	spaceBetween(element: BaseElement): void {
		this.binding.setElementStyle(element, { justifyContent: 'space-between' });
	}

	spaceAround(element: BaseElement): void {
		this.binding.setElementStyle(element, { justifyContent: 'space-around' });
	}
}