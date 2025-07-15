/**
 * Unit tests for layout managers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '../../src/core/ui/elements/container';
import { Element } from '../../src/core/ui/elements/element';
import { AbsoluteLayout, StackLayout, FlexLayout } from '../../src/core/ui/layouts';

describe('Layout Managers', () => {
	let container: Container;
	let child1: Element;
	let child2: Element;
	let child3: Element;

	beforeEach(() => {
		container = new Container({
			geometry: { left: 0, top: 0, width: 400, height: 300 },
			layout: { paddingLeft: 10, paddingTop: 10, paddingRight: 10, paddingBottom: 10 }
		});
		
		child1 = new Element({ 
			id: 'child1',
			geometry: { width: 100, height: 50 },
			layout: { marginLeft: 5, marginTop: 5, marginRight: 5, marginBottom: 5 }
		});
		
		child2 = new Element({ 
			id: 'child2',
			geometry: { width: 80, height: 40 },
			layout: { marginLeft: 5, marginTop: 5, marginRight: 5, marginBottom: 5 }
		});
		
		child3 = new Element({ 
			id: 'child3',
			geometry: { width: 120, height: 60 },
			layout: { marginLeft: 5, marginTop: 5, marginRight: 5, marginBottom: 5 }
		});
	});

	describe('AbsoluteLayout', () => {
		it('should maintain absolute positions', () => {
			container.layoutManager = new AbsoluteLayout();
			
			// Set specific positions
			child1.geometry = { left: 20, top: 30 };
			child2.geometry = { left: 150, top: 100 };
			
			container.addChild(child1);
			container.addChild(child2);
			container.calcLayout();
			
			// Positions should remain unchanged
			expect(child1.geometry.left).toBe(20);
			expect(child1.geometry.top).toBe(30);
			expect(child2.geometry.left).toBe(150);
			expect(child2.geometry.top).toBe(100);
		});
	});

	describe('StackLayout', () => {
		describe('vertical stacking', () => {
			it('should stack children vertically', () => {
				container.layoutManager = new StackLayout('vertical', 10);
				
				container.addChild(child1);
				container.addChild(child2);
				container.addChild(child3);
				container.calcLayout();
				
				// First child at padding + margin
				expect(child1.geometry.left).toBe(15); // padding(10) + margin(5)
				expect(child1.geometry.top).toBe(15);
				
				// Second child below first + gap
				expect(child2.geometry.left).toBe(15);
				expect(child2.geometry.top).toBe(15 + 50 + 5 + 5 + 10); // top + height + margins + gap
				
				// Third child below second + gap
				expect(child3.geometry.left).toBe(15);
				expect(child3.geometry.top).toBe(85 + 40 + 5 + 5 + 10);
			});

			it('should align children to center', () => {
				container.layoutManager = new StackLayout('vertical', 10, 'center');
				
				container.addChild(child1);
				container.addChild(child2);
				container.calcLayout();
				
				const availableWidth = 400 - 10 - 10; // container width - padding
				
				// First child centered
				expect(child1.geometry.left).toBe(10 + (availableWidth - 100) / 2);
				
				// Second child centered
				expect(child2.geometry.left).toBe(10 + (availableWidth - 80) / 2);
			});

			it('should align children to end', () => {
				container.layoutManager = new StackLayout('vertical', 10, 'end');
				
				container.addChild(child1);
				container.calcLayout();
				
				// First child at right edge minus padding and margin
				expect(child1.geometry.left).toBe(400 - 10 - 100 - 5); // width - padding - child width - margin
			});
		});

		describe('horizontal stacking', () => {
			it('should stack children horizontally', () => {
				container.layoutManager = new StackLayout('horizontal', 10);
				
				container.addChild(child1);
				container.addChild(child2);
				container.addChild(child3);
				container.calcLayout();
				
				// First child at padding + margin
				expect(child1.geometry.left).toBe(15);
				expect(child1.geometry.top).toBe(15);
				
				// Second child to right of first + gap
				expect(child2.geometry.left).toBe(15 + 100 + 5 + 5 + 10); // = 135
				expect(child2.geometry.top).toBe(15);
				
				// Third child to right of second + gap
				expect(child3.geometry.left).toBe(135 + 80 + 5 + 5 + 10); // = 235
				expect(child3.geometry.top).toBe(15);
			});
		});
	});

	describe('FlexLayout', () => {
		describe('row direction', () => {
			it('should layout children in row with start justification', () => {
				container.layoutManager = new FlexLayout('row', 'start', 'start', 10);
				
				container.addChild(child1);
				container.addChild(child2);
				container.addChild(child3);
				container.calcLayout();
				
				// Children should be laid out horizontally
				expect(child1.geometry.left).toBe(15);
				expect(child2.geometry.left).toBe(15 + 100 + 5 + 5 + 10); // = 135
				expect(child3.geometry.left).toBe(135 + 80 + 5 + 5 + 10); // = 235
				
				// All at same vertical position
				expect(child1.geometry.top).toBe(15);
				expect(child2.geometry.top).toBe(15);
				expect(child3.geometry.top).toBe(15);
			});

			it('should center justify content', () => {
				container.layoutManager = new FlexLayout('row', 'center', 'start', 10);
				
				container.addChild(child1);
				container.addChild(child2);
				container.calcLayout();
				
				const totalChildWidth = 100 + 5 + 5 + 80 + 5 + 5 + 10; // widths + margins + gap
				const availableWidth = 400 - 10 - 10;
				const startX = (availableWidth - totalChildWidth) / 2;
				
				expect(child1.geometry.left).toBeCloseTo(10 + startX + 5);
			});

			it('should space between items', () => {
				container.layoutManager = new FlexLayout('row', 'space-between', 'start', 0);
				
				container.addChild(child1);
				container.addChild(child2);
				container.calcLayout();
				
				// First child at start
				expect(child1.geometry.left).toBe(15);
				
				// Last child at end
				expect(child2.geometry.left).toBe(400 - 10 - 80 - 5);
			});

			it('should space around items', () => {
				container.layoutManager = new FlexLayout('row', 'space-around', 'start', 0);
				
				container.addChild(child1);
				container.addChild(child2);
				container.calcLayout();
				
				const totalChildWidth = 100 + 5 + 5 + 80 + 5 + 5;
				const availableWidth = 400 - 10 - 10;
				const spacing = (availableWidth - totalChildWidth) / 2;
				
				// First child should have half spacing before it
				expect(child1.geometry.left).toBeCloseTo(10 + spacing / 2 + 5);
			});

			it('should align items to center', () => {
				container.layoutManager = new FlexLayout('row', 'start', 'center', 10);
				
				container.addChild(child1);
				container.addChild(child2);
				container.calcLayout();
				
				const availableHeight = 300 - 10 - 10;
				
				// Children should be vertically centered
				expect(child1.geometry.top).toBe(10 + (availableHeight - 50) / 2);
				expect(child2.geometry.top).toBe(10 + (availableHeight - 40) / 2);
			});
		});

		describe('column direction', () => {
			it('should layout children in column', () => {
				container.layoutManager = new FlexLayout('column', 'start', 'start', 10);
				
				container.addChild(child1);
				container.addChild(child2);
				container.addChild(child3);
				container.calcLayout();
				
				// Children should be laid out vertically
				expect(child1.geometry.top).toBe(15);
				expect(child2.geometry.top).toBe(15 + 50 + 5 + 5 + 10);
				expect(child3.geometry.top).toBe(85 + 40 + 5 + 5 + 10);
				
				// All at same horizontal position
				expect(child1.geometry.left).toBe(15);
				expect(child2.geometry.left).toBe(15);
				expect(child3.geometry.left).toBe(15);
			});
		});
	});
});