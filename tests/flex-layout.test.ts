/**
 * Comprehensive unit tests for the FlexLayout system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FlexLayoutEngine, LayoutNode } from '../src/core/graphics/layout/FlexLayout.js';
import type { LayoutStyle } from '../src/core/graphics/layout/FlexLayout.js';

describe('FlexLayoutEngine', () => {
	let engine: FlexLayoutEngine;

	beforeEach(() => {
		engine = new FlexLayoutEngine();
	});

	describe('Basic Functionality', () => {
		it('should create layout engine with root node', () => {
			expect(engine.root).toBeDefined();
			expect(engine.root.children).toHaveLength(0);
		});

		it('should create new layout nodes', () => {
			const node = engine.createNode({ width: 100, height: 50 });
			expect(node).toBeDefined();
			expect(node.style.width).toBe(100);
			expect(node.style.height).toBe(50);
		});

		it('should calculate basic layout', () => {
			engine.calculateLayout(800, 600);
			expect(engine.root.computedLayout.width).toBe(800);
			expect(engine.root.computedLayout.height).toBe(600);
		});
	});

	describe('Layout Tree Operations', () => {
		it('should add child nodes correctly', () => {
			const child = engine.createNode({ width: 100, height: 50 });
			engine.appendChild(engine.root, child);
			
			expect(engine.root.children).toHaveLength(1);
			expect(child.parent).toBe(engine.root);
		});

		it('should insert child at specific index', () => {
			const child1 = engine.createNode({ width: 100 });
			const child2 = engine.createNode({ width: 200 });
			const child3 = engine.createNode({ width: 300 });

			engine.appendChild(engine.root, child1);
			engine.appendChild(engine.root, child3);
			engine.insertChild(engine.root, child2, 1);

			expect(engine.root.children[0]).toBe(child1);
			expect(engine.root.children[1]).toBe(child2);
			expect(engine.root.children[2]).toBe(child3);
		});

		it('should remove child nodes correctly', () => {
			const child = engine.createNode({ width: 100 });
			engine.appendChild(engine.root, child);
			engine.removeChild(engine.root, child);
			
			expect(engine.root.children).toHaveLength(0);
			expect(child.parent).toBeNull();
		});
	});

	describe('Dirty Flag Management', () => {
		it('should mark nodes dirty when style changes', () => {
			const node = engine.createNode();
			expect(node.isDirty()).toBe(true);
			
			node.calculateLayout();
			expect(node.isDirty()).toBe(false);
			
			node.setStyle({ width: 200 });
			expect(node.isDirty()).toBe(true);
		});

		it('should mark parent dirty when child is modified', () => {
			const child = engine.createNode();
			engine.appendChild(engine.root, child);
			
			engine.calculateLayout();
			expect(engine.root.isDirty()).toBe(false);
			
			child.setStyle({ width: 300 });
			expect(engine.root.isDirty()).toBe(true);
		});

		it('should track layout changes correctly', () => {
			const node = engine.createNode({ width: 100, height: 50 });
			node.calculateLayout();
			
			expect(node.hasNewLayout()).toBe(true);
			node.markLayoutClean();
			expect(node.hasNewLayout()).toBe(false);
		});
	});
});

describe('LayoutNode', () => {
	let node: LayoutNode;

	beforeEach(() => {
		node = new LayoutNode();
	});

	describe('Style Management', () => {
		it('should set and get style properties', () => {
			const style: LayoutStyle = {
				width: 200,
				height: 100,
				flexDirection: 'row',
				justifyContent: 'center'
			};

			node.setStyle(style);
			expect(node.style.width).toBe(200);
			expect(node.style.height).toBe(100);
			expect(node.style.flexDirection).toBe('row');
			expect(node.style.justifyContent).toBe('center');
		});

		it('should merge style updates', () => {
			node.setStyle({ width: 100, height: 50 });
			node.setStyle({ width: 200 }); // Should update width but keep height
			
			expect(node.style.width).toBe(200);
			expect(node.style.height).toBe(50);
		});
	});

	describe('Size Calculation', () => {
		it('should calculate fixed sizes correctly', () => {
			node.setStyle({ width: 300, height: 200 });
			node.calculateLayout(1000, 800);
			
			expect(node.computedLayout.width).toBe(300);
			expect(node.computedLayout.height).toBe(200);
		});

		it('should calculate auto sizes correctly', () => {
			node.setStyle({ width: 'auto', height: 'auto' });
			node.calculateLayout(500, 400);
			
			expect(node.computedLayout.width).toBe(500);
			expect(node.computedLayout.height).toBe(400);
		});

		it('should apply size constraints', () => {
			node.setStyle({
				width: 100,
				height: 50,
				minWidth: 150,
				maxWidth: 200,
				minHeight: 80,
				maxHeight: 120
			});
			node.calculateLayout();
			
			expect(node.computedLayout.width).toBe(150); // Constrained by minWidth
			expect(node.computedLayout.height).toBe(80);  // Constrained by minHeight
		});
	});

	describe('Margin and Padding', () => {
		it('should apply margin correctly', () => {
			node.setStyle({
				marginTop: 10,
				marginRight: 20,
				marginBottom: 30,
				marginLeft: 40
			});
			node.calculateLayout();
			
			expect(node.computedLayout.marginTop).toBe(10);
			expect(node.computedLayout.marginRight).toBe(20);
			expect(node.computedLayout.marginBottom).toBe(30);
			expect(node.computedLayout.marginLeft).toBe(40);
		});

		it('should apply padding correctly', () => {
			node.setStyle({
				paddingTop: 5,
				paddingRight: 15,
				paddingBottom: 25,
				paddingLeft: 35
			});
			node.calculateLayout();
			
			expect(node.computedLayout.paddingTop).toBe(5);
			expect(node.computedLayout.paddingRight).toBe(15);
			expect(node.computedLayout.paddingBottom).toBe(25);
			expect(node.computedLayout.paddingLeft).toBe(35);
		});
	});

	describe('Measure Function', () => {
		it('should use custom measure function for leaf nodes', () => {
			const measureFunc = () => ({ width: 250, height: 150 });
			node.setMeasureFunction(measureFunc);
			node.calculateLayout();
			
			expect(node.computedLayout.width).toBe(250);
			expect(node.computedLayout.height).toBe(150);
		});

		it('should not use measure function for nodes with children', () => {
			const measureFunc = () => ({ width: 250, height: 150 });
			node.setMeasureFunction(measureFunc);
			
			const child = new LayoutNode({ width: 100, height: 50 });
			node.appendChild(child);
			
			node.calculateLayout(500, 400);
			expect(node.computedLayout.width).toBe(500); // Uses container size, not measure function
		});
	});

	describe('Tree Operations', () => {
		it('should maintain parent-child relationships', () => {
			const child1 = new LayoutNode();
			const child2 = new LayoutNode();
			
			node.appendChild(child1);
			node.appendChild(child2);
			
			expect(node.children).toHaveLength(2);
			expect(child1.parent).toBe(node);
			expect(child2.parent).toBe(node);
		});

		it('should transfer children between parents', () => {
			const parent1 = new LayoutNode();
			const parent2 = new LayoutNode();
			const child = new LayoutNode();
			
			parent1.appendChild(child);
			expect(parent1.children).toHaveLength(1);
			expect(child.parent).toBe(parent1);
			
			parent2.appendChild(child); // Should move from parent1 to parent2
			expect(parent1.children).toHaveLength(0);
			expect(parent2.children).toHaveLength(1);
			expect(child.parent).toBe(parent2);
		});
	});

	describe('Layout Box Calculation', () => {
		it('should return correct layout box', () => {
			node.setStyle({ width: 200, height: 100 });
			node.calculateLayout();
			
			const box = node.getLayoutBox();
			expect(box.x).toBe(0);
			expect(box.y).toBe(0);
			expect(box.width).toBe(200);
			expect(box.height).toBe(100);
		});
	});
});

describe('Flexbox Layout Algorithm', () => {
	let engine: FlexLayoutEngine;
	let container: LayoutNode;

	beforeEach(() => {
		engine = new FlexLayoutEngine();
		container = engine.createNode({
			width: 600,
			height: 400,
			flexDirection: 'row'
		});
	});

	describe('Flex Direction', () => {
		it('should layout children in row direction', () => {
			const child1 = engine.createNode({ width: 100, height: 50 });
			const child2 = engine.createNode({ width: 150, height: 50 });
			
			container.appendChild(child1);
			container.appendChild(child2);
			container.calculateLayout();
			
			expect(child1.computedLayout.x).toBe(0);
			expect(child2.computedLayout.x).toBe(100); // After child1
		});

		it('should layout children in column direction', () => {
			container.setStyle({ flexDirection: 'column' });
			
			const child1 = engine.createNode({ width: 100, height: 50 });
			const child2 = engine.createNode({ width: 100, height: 75 });
			
			container.appendChild(child1);
			container.appendChild(child2);
			container.calculateLayout();
			
			expect(child1.computedLayout.y).toBe(0);
			expect(child2.computedLayout.y).toBe(50); // After child1
		});
	});

	describe('Justify Content', () => {
		beforeEach(() => {
			// Create container with some remaining space
			container.setStyle({ width: 500, flexDirection: 'row' });
			
			const child1 = engine.createNode({ width: 100, height: 50 });
			const child2 = engine.createNode({ width: 100, height: 50 });
			
			container.appendChild(child1);
			container.appendChild(child2);
		});

		it('should justify content flex-start (default)', () => {
			container.setStyle({ justifyContent: 'flex-start' });
			container.calculateLayout();
			
			const [child1, child2] = container.children;
			expect(child1.computedLayout.x).toBe(0);
			expect(child2.computedLayout.x).toBe(100);
		});

		it('should justify content center', () => {
			container.setStyle({ justifyContent: 'center' });
			container.calculateLayout();
			
			const [child1, child2] = container.children;
			// Remaining space: 500 - 200 = 300, centered = 150 offset
			expect(child1.computedLayout.x).toBe(150);
			expect(child2.computedLayout.x).toBe(250);
		});

		it('should justify content flex-end', () => {
			container.setStyle({ justifyContent: 'flex-end' });
			container.calculateLayout();
			
			const [child1, child2] = container.children;
			// Remaining space: 500 - 200 = 300, all at end
			expect(child1.computedLayout.x).toBe(300);
			expect(child2.computedLayout.x).toBe(400);
		});

		it('should justify content space-between', () => {
			container.setStyle({ justifyContent: 'space-between' });
			container.calculateLayout();
			
			const [child1, child2] = container.children;
			// Space distributed between children
			expect(child1.computedLayout.x).toBe(0);
			expect(child2.computedLayout.x).toBe(400); // 500 - 100
		});
	});

	describe('Align Items', () => {
		beforeEach(() => {
			container.setStyle({
				width: 400,
				height: 300,
				flexDirection: 'row'
			});
		});

		it('should align items stretch (default)', () => {
			const child = engine.createNode({ width: 100, height: 50 });
			container.appendChild(child);
			container.setStyle({ alignItems: 'stretch' });
			container.calculateLayout();
			
			// Child should stretch to fill cross axis
			expect(child.computedLayout.height).toBe(300); // Container height
			expect(child.computedLayout.y).toBe(0);
		});

		it('should align items center', () => {
			const child = engine.createNode({ width: 100, height: 50 });
			container.appendChild(child);
			container.setStyle({ alignItems: 'center' });
			container.calculateLayout();
			
			// Child should be centered vertically
			expect(child.computedLayout.y).toBe(125); // (300 - 50) / 2
		});

		it('should align items flex-end', () => {
			const child = engine.createNode({ width: 100, height: 50 });
			container.appendChild(child);
			container.setStyle({ alignItems: 'flex-end' });
			container.calculateLayout();
			
			// Child should be at bottom
			expect(child.computedLayout.y).toBe(250); // 300 - 50
		});
	});

	describe('Flex Grow and Shrink', () => {
		it('should grow children to fill available space', () => {
			container.setStyle({ width: 500 });
			
			const child1 = engine.createNode({ width: 100, flexGrow: 1 });
			const child2 = engine.createNode({ width: 100, flexGrow: 2 });
			
			container.appendChild(child1);
			container.appendChild(child2);
			container.calculateLayout();
			
			// Remaining space: 500 - 200 = 300
			// Child1 gets 1/3 = 100 extra, Child2 gets 2/3 = 200 extra
			expect(child1.computedLayout.width).toBe(200); // 100 + 100
			expect(child2.computedLayout.width).toBe(300); // 100 + 200
		});

		it('should shrink children when space is insufficient', () => {
			container.setStyle({ width: 150 }); // Less than children need
			
			const child1 = engine.createNode({ width: 100, flexShrink: 1 });
			const child2 = engine.createNode({ width: 100, flexShrink: 2 });
			
			container.appendChild(child1);
			container.appendChild(child2);
			container.calculateLayout();
			
			// Overflow: 200 - 150 = 50 needs to be removed
			// Child1 shrinks by 1/3 = ~16.67, Child2 shrinks by 2/3 = ~33.33
			expect(child1.computedLayout.width).toBeCloseTo(83.33, 1);
			expect(child2.computedLayout.width).toBeCloseTo(66.67, 1);
		});
	});

	describe('Complex Layouts', () => {
		it('should handle nested flex containers', () => {
			const outerContainer = engine.createNode({
				width: 600,
				height: 400,
				flexDirection: 'column'
			});

			const topRow = engine.createNode({
				width: 600,
				height: 200,
				flexDirection: 'row'
			});

			const bottomRow = engine.createNode({
				width: 600,
				height: 200,
				flexDirection: 'row'
			});

			const child1 = engine.createNode({ width: 200, height: 200 });
			const child2 = engine.createNode({ width: 400, height: 200 });
			const child3 = engine.createNode({ width: 300, height: 200 });
			const child4 = engine.createNode({ width: 300, height: 200 });

			topRow.appendChild(child1);
			topRow.appendChild(child2);
			bottomRow.appendChild(child3);
			bottomRow.appendChild(child4);
			outerContainer.appendChild(topRow);
			outerContainer.appendChild(bottomRow);

			outerContainer.calculateLayout();

			// Check positioning
			expect(topRow.computedLayout.y).toBe(0);
			expect(bottomRow.computedLayout.y).toBe(200);
			expect(child1.computedLayout.x).toBe(0);
			expect(child2.computedLayout.x).toBe(200);
			expect(child3.computedLayout.x).toBe(0);
			expect(child4.computedLayout.x).toBe(300);
		});
	});

	describe('Edge Cases', () => {
		it('should handle zero-sized containers', () => {
			const zeroContainer = engine.createNode({ width: 0, height: 0 });
			const child = engine.createNode({ width: 100, height: 50 });
			
			zeroContainer.appendChild(child);
			zeroContainer.calculateLayout();
			
			expect(child.computedLayout.width).toBe(100);
			expect(child.computedLayout.height).toBe(50);
		});

		it('should handle containers with no children', () => {
			const emptyContainer = engine.createNode({ width: 200, height: 100 });
			emptyContainer.calculateLayout();
			
			expect(emptyContainer.computedLayout.width).toBe(200);
			expect(emptyContainer.computedLayout.height).toBe(100);
		});

		it('should handle negative flex values gracefully', () => {
			container.setStyle({ width: 300 });
			
			const child1 = engine.createNode({ width: 100, flexGrow: -1 }); // Invalid
			const child2 = engine.createNode({ width: 100, flexGrow: 1 });
			
			container.appendChild(child1);
			container.appendChild(child2);
			container.calculateLayout();
			
			// Negative flex should be treated as 0
			expect(child1.computedLayout.width).toBe(100); // No change
			expect(child2.computedLayout.width).toBe(200); // Gets all remaining space
		});
	});
});

describe('Performance and Optimization', () => {
	let engine: FlexLayoutEngine;

	beforeEach(() => {
		engine = new FlexLayoutEngine();
	});

	describe('Layout Caching', () => {
		it('should cache layout results when not dirty', () => {
			const node = engine.createNode({ width: 200, height: 100 });
			
			// First calculation
			const start1 = performance.now();
			node.calculateLayout();
			const time1 = performance.now() - start1;
			
			const firstResult = { ...node.computedLayout };
			
			// Second calculation (should use cache)
			const start2 = performance.now();
			node.calculateLayout();
			const time2 = performance.now() - start2;
			
			expect(node.computedLayout).toEqual(firstResult);
			// Second calculation should be faster (cached)
			expect(time2).toBeLessThan(time1 * 2); // Allow some variance
		});

		it('should invalidate cache when style changes', () => {
			const node = engine.createNode({ width: 200, height: 100 });
			node.calculateLayout();
			
			const firstWidth = node.computedLayout.width;
			
			node.setStyle({ width: 400 });
			node.calculateLayout();
			
			expect(node.computedLayout.width).not.toBe(firstWidth);
			expect(node.computedLayout.width).toBe(400);
		});
	});

	describe('Large Tree Performance', () => {
		it('should handle large trees efficiently', () => {
			const container = engine.createNode({
				width: 1000,
				height: 1000,
				flexDirection: 'column'
			});

			// Create 100 children
			for (let i = 0; i < 100; i++) {
				const child = engine.createNode({
					width: 1000,
					height: 10,
					flexGrow: 1
				});
				container.appendChild(child);
			}

			const start = performance.now();
			container.calculateLayout();
			const duration = performance.now() - start;

			// Should complete in reasonable time (adjust threshold as needed)
			expect(duration).toBeLessThan(100); // 100ms threshold
			expect(container.children).toHaveLength(100);
		});
	});
});