/**
 * Unit tests for Container class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '../../src/core/ui/elements/container';
import { Element } from '../../src/core/ui/elements/element';
import { DirtyFlags } from '../../src/core/ui/types';

describe('Container', () => {
	let container: Container;
	let child1: Element;
	let child2: Element;

	beforeEach(() => {
		container = new Container();
		child1 = new Element({ id: 'child1' });
		child2 = new Element({ id: 'child2' });
	});

	describe('constructor', () => {
		it('should create container with empty children array', () => {
			expect(container.children).toHaveLength(0);
			expect(container.layoutManager).toBe(null);
		});

		it('should accept layout manager in config', () => {
			const mockLayoutManager = { 
				name: 'mock', 
				calculateLayout: () => {} 
			};
			
			const cont = new Container({ layoutManager: mockLayoutManager });
			
			expect(cont.layoutManager).toBe(mockLayoutManager);
		});
	});

	describe('child management', () => {
		it('should add child', () => {
			container.addChild(child1);
			
			expect(container.children).toHaveLength(1);
			expect(container.children[0]).toBe(child1);
			expect(child1.parent).toBe(container);
		});

		it('should not add same child twice', () => {
			container.addChild(child1);
			container.addChild(child1);
			
			expect(container.children).toHaveLength(1);
		});

		it('should remove child from previous parent', () => {
			const otherContainer = new Container();
			otherContainer.addChild(child1);
			
			container.addChild(child1);
			
			expect(otherContainer.children).toHaveLength(0);
			expect(container.children).toHaveLength(1);
			expect(child1.parent).toBe(container);
		});

		it('should emit events on add', () => {
			let parentEvent: Element | null = null;
			let childEvent: Container | null = null;
			
			container.on('childAdded', (child: Element) => { parentEvent = child; });
			child1.on('addedToParent', (parent: Container) => { childEvent = parent; });
			
			container.addChild(child1);
			
			expect(parentEvent).toBe(child1);
			expect(childEvent).toBe(container);
		});

		it('should remove child', () => {
			container.addChild(child1);
			container.addChild(child2);
			
			const removed = container.removeChild(child1);
			
			expect(removed).toBe(true);
			expect(container.children).toHaveLength(1);
			expect(container.children[0]).toBe(child2);
			expect(child1.parent).toBe(null);
		});

		it('should return false when removing non-child', () => {
			const removed = container.removeChild(child1);
			
			expect(removed).toBe(false);
		});

		it('should emit events on remove', () => {
			container.addChild(child1);
			
			let parentEvent: Element | null = null;
			let childEvent: Container | null = null;
			
			container.on('childRemoved', (child: Element) => { parentEvent = child; });
			child1.on('removedFromParent', (parent: Container) => { childEvent = parent; });
			
			container.removeChild(child1);
			
			expect(parentEvent).toBe(child1);
			expect(childEvent).toBe(container);
		});

		it('should remove all children', () => {
			container.addChild(child1);
			container.addChild(child2);
			
			container.removeAllChildren();
			
			expect(container.children).toHaveLength(0);
			expect(child1.parent).toBe(null);
			expect(child2.parent).toBe(null);
		});
	});

	describe('child queries', () => {
		beforeEach(() => {
			child1.geometry = { left: 0, top: 0, width: 50, height: 50 };
			child2.geometry = { left: 60, top: 0, width: 50, height: 50 };
		});

		it('should find child by id', () => {
			container.addChild(child1);
			container.addChild(child2);
			
			expect(container.getChildById('child1')).toBe(child1);
			expect(container.getChildById('child2')).toBe(child2);
			expect(container.getChildById('unknown')).toBe(null);
		});

		it('should find nested child by id', () => {
			const subContainer = new Container({ id: 'sub' });
			subContainer.addChild(child2);
			container.addChild(child1);
			container.addChild(subContainer);
			
			expect(container.getChildById('child2')).toBe(child2);
		});

		it('should get children at point', () => {
			container.addChild(child1);
			container.addChild(child2);
			
			const hits1 = container.getChildrenAt(25, 25);
			expect(hits1).toHaveLength(1);
			expect(hits1[0]).toBe(child1);
			
			const hits2 = container.getChildrenAt(85, 25);
			expect(hits2).toHaveLength(1);
			expect(hits2[0]).toBe(child2);
			
			const hits3 = container.getChildrenAt(55, 25);
			expect(hits3).toHaveLength(0);
		});

		it('should get children in reverse order (top to bottom)', () => {
			child2.geometry = { left: 0, top: 0, width: 50, height: 50 }; // Overlap with child1
			container.addChild(child1);
			container.addChild(child2);
			
			const hits = container.getChildrenAt(25, 25);
			expect(hits).toHaveLength(2);
			expect(hits[0]).toBe(child2); // Top element first
			expect(hits[1]).toBe(child1);
		});
	});

	describe('layout', () => {
		it('should mark dirty on child add/remove', () => {
			container.clearDirty(DirtyFlags.All);
			
			container.addChild(child1);
			expect(container.isDirty(DirtyFlags.Layout)).toBe(true);
			
			container.clearDirty(DirtyFlags.All);
			
			container.removeChild(child1);
			expect(container.isDirty(DirtyFlags.Layout)).toBe(true);
		});

		it('should call layout manager on calcLayout', () => {
			let layoutCalled = false;
			container.layoutManager = {
				name: 'test',
				calculateLayout: () => { layoutCalled = true; }
			};
			
			container.calcLayout();
			
			expect(layoutCalled).toBe(true);
		});

		it('should recursively calculate child layouts', () => {
			const subContainer = new Container();
			let subLayoutCalled = false;
			subContainer.layoutManager = {
				name: 'test',
				calculateLayout: () => { subLayoutCalled = true; }
			};
			
			container.addChild(subContainer);
			container.calcLayout();
			
			expect(subLayoutCalled).toBe(true);
		});
	});

	describe('lifecycle', () => {
		it('should mount children when container mounts', () => {
			let child1Mounted = false;
			let child2Mounted = false;
			
			child1.on('mount', () => { child1Mounted = true; });
			child2.on('mount', () => { child2Mounted = true; });
			
			container.addChild(child1);
			container.addChild(child2);
			container.mount();
			
			expect(child1Mounted).toBe(true);
			expect(child2Mounted).toBe(true);
		});

		it('should unmount children when container unmounts', () => {
			container.addChild(child1);
			container.addChild(child2);
			container.mount();
			
			let child1Unmounted = false;
			let child2Unmounted = false;
			
			child1.on('unmount', () => { child1Unmounted = true; });
			child2.on('unmount', () => { child2Unmounted = true; });
			
			container.unmount();
			
			expect(child1Unmounted).toBe(true);
			expect(child2Unmounted).toBe(true);
		});

		it('should update children when container updates', () => {
			container.addChild(child1);
			container.addChild(child2);
			
			child1.markDirty(DirtyFlags.Geometry);
			child2.markDirty(DirtyFlags.Appearance);
			
			container.update();
			
			expect(child1.isDirty()).toBe(false);
			expect(child2.isDirty()).toBe(false);
		});

		it('should destroy all children on destroy', () => {
			container.addChild(child1);
			container.addChild(child2);
			
			container.destroy();
			
			expect(container.children).toHaveLength(0);
		});
	});
});