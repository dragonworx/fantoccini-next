/**
 * Unit tests for LayoutBinding and LayoutPropertyManager.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LayoutBinding, LayoutPropertyManager } from '../src/core/graphics/layout/LayoutBinding.js';
import { BaseElement } from '../src/core/graphics/elements/BaseElement.js';
import type { LayoutStyle } from '../src/core/graphics/layout/FlexLayout.js';

// Mock View class for testing
class MockView {
	public layoutBinding: LayoutBinding;
	public layoutCalculationCount = 0;

	constructor() {
		this.layoutBinding = new LayoutBinding();
	}

	invalidate() {
		// Mock invalidation
	}

	calculateLayout() {
		this.layoutCalculationCount++;
	}
}

// Mock Element for testing
class MockElement extends BaseElement {
	constructor(view: MockView, options: any = {}) {
		super(view, options);
	}

	render(context: CanvasRenderingContext2D): void {
		// Mock render
	}
}

describe('LayoutBinding', () => {
	let binding: LayoutBinding;
	let view: MockView;
	let element: MockElement;

	beforeEach(() => {
		view = new MockView();
		binding = view.layoutBinding;
		element = new MockElement(view);
	});

	describe('Element Binding', () => {
		it('should bind element to layout node', () => {
			const style: LayoutStyle = { width: 200, height: 100 };
			const node = binding.bindElement(element, style);

			expect(node).toBeDefined();
			expect(node.style.width).toBe(200);
			expect(node.style.height).toBe(100);
			expect(node.userData).toBe(element);
		});

		it('should return existing node for already bound element', () => {
			const node1 = binding.bindElement(element, { width: 100 });
			const node2 = binding.bindElement(element, { height: 200 });

			expect(node1).toBe(node2);
			expect(node1.style.width).toBe(100);
			expect(node1.style.height).toBe(200); // Style should be updated
		});

		it('should unbind element and remove node', () => {
			const node = binding.bindElement(element, { width: 100 });
			expect(binding.getLayoutNode(element)).toBe(node);

			binding.unbindElement(element);
			expect(binding.getLayoutNode(element)).toBeNull();
			expect(node.userData).toBeNull();
		});

		it('should maintain bidirectional mapping', () => {
			const node = binding.bindElement(element, { width: 100 });
			
			expect(binding.getLayoutNode(element)).toBe(node);
			expect(binding.getElement(node)).toBe(element);
		});
	});

	describe('Hierarchy Synchronization', () => {
		it('should sync element hierarchy to layout nodes', () => {
			const parent = new MockElement(view);
			const child1 = new MockElement(view);
			const child2 = new MockElement(view);

			// Bind all elements
			const parentNode = binding.bindElement(parent, {});
			const child1Node = binding.bindElement(child1, {});
			const child2Node = binding.bindElement(child2, {});

			// Set up element hierarchy
			parent.appendChild(child1);
			parent.appendChild(child2);

			// Sync hierarchy
			binding.syncElementHierarchy(parent);

			// Check layout hierarchy matches
			expect(parentNode.children).toHaveLength(2);
			expect(parentNode.children[0]).toBe(child1Node);
			expect(parentNode.children[1]).toBe(child2Node);
			expect(child1Node.parent).toBe(parentNode);
			expect(child2Node.parent).toBe(parentNode);
		});

		it('should handle hierarchy changes', () => {
			const parent1 = new MockElement(view);
			const parent2 = new MockElement(view);
			const child = new MockElement(view);

			const parent1Node = binding.bindElement(parent1, {});
			const parent2Node = binding.bindElement(parent2, {});
			const childNode = binding.bindElement(child, {});

			// Initially add child to parent1
			parent1.appendChild(child);
			binding.syncElementHierarchy(parent1);
			expect(parent1Node.children).toContain(childNode);

			// Move child to parent2
			parent2.appendChild(child); // This removes from parent1
			binding.syncElementHierarchy(parent1);
			binding.syncElementHierarchy(parent2);

			expect(parent1Node.children).not.toContain(childNode);
			expect(parent2Node.children).toContain(childNode);
			expect(childNode.parent).toBe(parent2Node);
		});

		it('should handle removal of children', () => {
			const parent = new MockElement(view);
			const child = new MockElement(view);

			const parentNode = binding.bindElement(parent, {});
			const childNode = binding.bindElement(child, {});

			parent.appendChild(child);
			binding.syncElementHierarchy(parent);
			expect(parentNode.children).toContain(childNode);

			parent.removeChild(child);
			binding.syncElementHierarchy(parent);
			expect(parentNode.children).not.toContain(childNode);
		});
	});

	describe('Layout Calculation and Application', () => {
		it('should calculate layout for bound elements', () => {
			const parent = new MockElement(view);
			const child = new MockElement(view);

			binding.bindElement(parent, { width: 400, height: 300, flexDirection: 'row' });
			binding.bindElement(child, { width: 200, height: 100 });

			parent.appendChild(child);
			binding.syncElementHierarchy(parent);

			binding.calculateLayout(400, 300);

			// Check that layout was calculated
			const parentNode = binding.getLayoutNode(parent)!;
			const childNode = binding.getLayoutNode(child)!;

			expect(parentNode.computedLayout.width).toBe(400);
			expect(parentNode.computedLayout.height).toBe(300);
			expect(childNode.computedLayout.width).toBe(200);
			expect(childNode.computedLayout.height).toBe(100);
		});

		it('should apply layout results to elements', () => {
			const setLayoutResultSpy = vi.spyOn(element, 'setLayoutResult');
			
			const node = binding.bindElement(element, { width: 300, height: 200 });
			binding.calculateLayout(500, 400);
			
			// Mock that layout has changed
			node.markDirty();
			node.calculateLayout();
			
			binding.applyLayoutToElements();

			expect(setLayoutResultSpy).toHaveBeenCalledWith({
				x: 0,
				y: 0,
				width: 300,
				height: 200
			});
		});

		it('should only apply layout to elements with new layout', () => {
			const element1 = new MockElement(view);
			const element2 = new MockElement(view);

			const spy1 = vi.spyOn(element1, 'setLayoutResult');
			const spy2 = vi.spyOn(element2, 'setLayoutResult');

			const node1 = binding.bindElement(element1, { width: 100 });
			const node2 = binding.bindElement(element2, { width: 200 });

			binding.calculateLayout();

			// Only node1 has new layout
			node1.markDirty();
			node1.calculateLayout();
			node2.markLayoutClean(); // No new layout

			binding.applyLayoutToElements();

			expect(spy1).toHaveBeenCalled();
			expect(spy2).not.toHaveBeenCalled();
		});
	});

	describe('Style Management', () => {
		it('should update element style properties', () => {
			const node = binding.bindElement(element, { width: 100 });
			
			binding.setElementStyle(element, { 
				width: 200, 
				height: 150,
				flexGrow: 1 
			});

			expect(node.style.width).toBe(200);
			expect(node.style.height).toBe(150);
			expect(node.style.flexGrow).toBe(1);
		});

		it('should get element layout box', () => {
			const node = binding.bindElement(element, { width: 300, height: 200 });
			binding.calculateLayout();

			const layout = binding.getElementLayout(element);
			expect(layout).toEqual({
				x: 0,
				y: 0,
				width: 300,
				height: 200
			});
		});

		it('should return null for unbound element layout', () => {
			const unboundElement = new MockElement(view);
			const layout = binding.getElementLayout(unboundElement);
			expect(layout).toBeNull();
		});
	});

	describe('Root Element Management', () => {
		it('should set root element', () => {
			const rootElement = new MockElement(view);
			const rootStyle = { width: 800, height: 600, flexDirection: 'column' as const };

			binding.setRootElement(rootElement, rootStyle);

			const rootNode = binding.getRootNode();
			expect(binding.getElement(rootNode)).toBe(rootElement);
			expect(rootNode.style.width).toBe(800);
			expect(rootNode.style.height).toBe(600);
			expect(rootNode.style.flexDirection).toBe('column');
		});
	});

	describe('Layout State Management', () => {
		it('should detect when layout is needed', () => {
			binding.bindElement(element, { width: 100 });
			
			// Initially needs layout
			expect(binding.needsLayout()).toBe(true);
			
			binding.calculateLayout();
			expect(binding.needsLayout()).toBe(false);
			
			// Change style should need layout again
			binding.setElementStyle(element, { width: 200 });
			expect(binding.needsLayout()).toBe(true);
		});
	});

	describe('Cleanup', () => {
		it('should dispose and clear all mappings', () => {
			const element1 = new MockElement(view);
			const element2 = new MockElement(view);

			binding.bindElement(element1, { width: 100 });
			binding.bindElement(element2, { width: 200 });

			expect(binding.getLayoutNode(element1)).toBeDefined();
			expect(binding.getLayoutNode(element2)).toBeDefined();

			binding.dispose();

			expect(binding.getLayoutNode(element1)).toBeNull();
			expect(binding.getLayoutNode(element2)).toBeNull();
		});
	});
});

describe('LayoutPropertyManager', () => {
	let binding: LayoutBinding;
	let manager: LayoutPropertyManager;
	let view: MockView;
	let element: MockElement;

	beforeEach(() => {
		view = new MockView();
		binding = view.layoutBinding;
		manager = new LayoutPropertyManager(binding);
		element = new MockElement(view);
		binding.bindElement(element, {});
	});

	describe('Size Properties', () => {
		it('should set width and height', () => {
			manager.setSize(element, 300, 200);
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.width).toBe(300);
			expect(node.style.height).toBe(200);
		});

		it('should set individual width and height', () => {
			manager.setWidth(element, 400);
			manager.setHeight(element, 'auto');
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.width).toBe(400);
			expect(node.style.height).toBe('auto');
		});

		it('should set size constraints', () => {
			manager.setConstraints(element, {
				minWidth: 100,
				maxWidth: 500,
				minHeight: 50,
				maxHeight: 300
			});
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.minWidth).toBe(100);
			expect(node.style.maxWidth).toBe(500);
			expect(node.style.minHeight).toBe(50);
			expect(node.style.maxHeight).toBe(300);
		});
	});

	describe('Margin Properties', () => {
		it('should set uniform margin', () => {
			manager.setMargin(element, 20);
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.marginTop).toBe(20);
			expect(node.style.marginRight).toBe(20);
			expect(node.style.marginBottom).toBe(20);
			expect(node.style.marginLeft).toBe(20);
		});

		it('should set vertical and horizontal margin', () => {
			manager.setMargin(element, 15, 25);
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.marginTop).toBe(15);
			expect(node.style.marginRight).toBe(25);
			expect(node.style.marginBottom).toBe(15);
			expect(node.style.marginLeft).toBe(25);
		});

		it('should set individual margins', () => {
			manager.setMargin(element, 10, 20, 30, 40);
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.marginTop).toBe(10);
			expect(node.style.marginRight).toBe(20);
			expect(node.style.marginBottom).toBe(30);
			expect(node.style.marginLeft).toBe(40);
		});
	});

	describe('Padding Properties', () => {
		it('should set uniform padding', () => {
			manager.setPadding(element, 15);
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.paddingTop).toBe(15);
			expect(node.style.paddingRight).toBe(15);
			expect(node.style.paddingBottom).toBe(15);
			expect(node.style.paddingLeft).toBe(15);
		});

		it('should set vertical and horizontal padding', () => {
			manager.setPadding(element, 12, 18);
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.paddingTop).toBe(12);
			expect(node.style.paddingRight).toBe(18);
			expect(node.style.paddingBottom).toBe(12);
			expect(node.style.paddingLeft).toBe(18);
		});

		it('should set individual padding', () => {
			manager.setPadding(element, 5, 10, 15, 20);
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.paddingTop).toBe(5);
			expect(node.style.paddingRight).toBe(10);
			expect(node.style.paddingBottom).toBe(15);
			expect(node.style.paddingLeft).toBe(20);
		});
	});

	describe('Flexbox Container Properties', () => {
		it('should set flex container properties', () => {
			manager.setFlexContainer(element, {
				direction: 'column',
				wrap: 'wrap',
				justifyContent: 'center',
				alignItems: 'flex-end',
				alignContent: 'space-between'
			});
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.flexDirection).toBe('column');
			expect(node.style.flexWrap).toBe('wrap');
			expect(node.style.justifyContent).toBe('center');
			expect(node.style.alignItems).toBe('flex-end');
			expect(node.style.alignContent).toBe('space-between');
		});
	});

	describe('Flexbox Item Properties', () => {
		it('should set flex item properties', () => {
			manager.setFlexItem(element, {
				grow: 2,
				shrink: 0.5,
				basis: 100,
				alignSelf: 'center'
			});
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.flexGrow).toBe(2);
			expect(node.style.flexShrink).toBe(0.5);
			expect(node.style.flexBasis).toBe(100);
			expect(node.style.alignSelf).toBe('center');
		});
	});

	describe('Convenience Methods', () => {
		it('should make flex row', () => {
			manager.makeFlexRow(element);
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.flexDirection).toBe('row');
		});

		it('should make flex column', () => {
			manager.makeFlexColumn(element);
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.flexDirection).toBe('column');
		});

		it('should center content', () => {
			manager.centerContent(element);
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.justifyContent).toBe('center');
			expect(node.style.alignItems).toBe('center');
		});

		it('should fill space', () => {
			manager.fillSpace(element);
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.flexGrow).toBe(1);
		});

		it('should space between', () => {
			manager.spaceBetween(element);
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.justifyContent).toBe('space-between');
		});

		it('should space around', () => {
			manager.spaceAround(element);
			
			const node = binding.getLayoutNode(element)!;
			expect(node.style.justifyContent).toBe('space-around');
		});
	});

	describe('Integration with Element Properties', () => {
		it('should handle element with no bound node gracefully', () => {
			const unboundElement = new MockElement(view);
			
			// Should not throw errors
			expect(() => {
				manager.setSize(unboundElement, 100, 100);
				manager.setMargin(unboundElement, 10);
				manager.centerContent(unboundElement);
			}).not.toThrow();
		});
	});
});