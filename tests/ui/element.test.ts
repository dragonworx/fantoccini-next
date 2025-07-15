/**
 * Unit tests for Element class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Element } from '../../src/core/ui/elements/element';
import { DirtyFlags } from '../../src/core/ui/types';

describe('Element', () => {
	let element: Element;

	beforeEach(() => {
		element = new Element();
	});

	describe('constructor', () => {
		it('should create element with default properties', () => {
			expect(element.id).toMatch(/^element-/);
			expect(element.visible).toBe(true);
			expect(element.interactive).toBe(true);
			expect(element.parent).toBe(null);
			expect(element.view).toBe(null);
		});

		it('should accept configuration', () => {
			const config = {
				id: 'test-element',
				visible: false,
				interactive: false,
				geometry: { left: 10, top: 20, width: 200, height: 150 },
				appearance: { alpha: 0.5, backgroundColor: 0xFF0000 }
			};
			
			const el = new Element(config);
			
			expect(el.id).toBe('test-element');
			expect(el.visible).toBe(false);
			expect(el.interactive).toBe(false);
			expect(el.geometry.left).toBe(10);
			expect(el.geometry.top).toBe(20);
			expect(el.geometry.width).toBe(200);
			expect(el.geometry.height).toBe(150);
			expect(el.appearance.alpha).toBe(0.5);
			expect(el.appearance.backgroundColor).toBe(0xFF0000);
		});
	});

	describe('geometry', () => {
		it('should have default geometry', () => {
			const geo = element.geometry;
			expect(geo.left).toBe(0);
			expect(geo.top).toBe(0);
			expect(geo.width).toBe(100);
			expect(geo.height).toBe(100);
		});

		it('should update geometry and mark dirty', () => {
			element.clearDirty(DirtyFlags.All);
			
			element.geometry = { left: 50, top: 75 };
			
			expect(element.geometry.left).toBe(50);
			expect(element.geometry.top).toBe(75);
			expect(element.isDirty(DirtyFlags.Geometry)).toBe(true);
			expect(element.isDirty(DirtyFlags.Transform)).toBe(true);
		});

		it('should not mark dirty if geometry unchanged', () => {
			element.clearDirty(DirtyFlags.All);
			const geo = element.geometry;
			
			element.geometry = { left: geo.left, top: geo.top };
			
			expect(element.isDirty()).toBe(false);
		});
	});

	describe('appearance', () => {
		it('should have default appearance', () => {
			const app = element.appearance;
			expect(app.alpha).toBe(1);
			expect(app.backgroundColor).toBe(0xFFFFFF);
			expect(app.borderColor).toBe(0x000000);
			expect(app.borderWidth).toBe(0);
			expect(app.borderRadius).toBe(0);
		});

		it('should update appearance and mark dirty', () => {
			element.clearDirty(DirtyFlags.All);
			
			element.appearance = { alpha: 0.7, backgroundColor: 0x00FF00 };
			
			expect(element.appearance.alpha).toBe(0.7);
			expect(element.appearance.backgroundColor).toBe(0x00FF00);
			expect(element.isDirty(DirtyFlags.Appearance)).toBe(true);
		});
	});

	describe('layout', () => {
		it('should have default layout', () => {
			const layout = element.layout;
			expect(layout.paddingLeft).toBe(0);
			expect(layout.paddingRight).toBe(0);
			expect(layout.paddingTop).toBe(0);
			expect(layout.paddingBottom).toBe(0);
			expect(layout.marginLeft).toBe(0);
			expect(layout.marginRight).toBe(0);
			expect(layout.marginTop).toBe(0);
			expect(layout.marginBottom).toBe(0);
			expect(layout.hAlign).toBe('left');
			expect(layout.vAlign).toBe('top');
		});

		it('should update layout and mark dirty', () => {
			element.clearDirty(DirtyFlags.All);
			
			element.layout = { paddingLeft: 10, paddingTop: 5 };
			
			expect(element.layout.paddingLeft).toBe(10);
			expect(element.layout.paddingTop).toBe(5);
			expect(element.isDirty(DirtyFlags.Layout)).toBe(true);
		});
	});

	describe('dirty tracking', () => {
		it('should start with all flags dirty', () => {
			expect(element.isDirty()).toBe(true);
			expect(element.dirtyFlags).toBe(DirtyFlags.All);
		});

		it('should mark specific flags as dirty', () => {
			element.clearDirty(DirtyFlags.All);
			
			element.markDirty(DirtyFlags.Geometry);
			
			expect(element.isDirty(DirtyFlags.Geometry)).toBe(true);
			expect(element.isDirty(DirtyFlags.Appearance)).toBe(false);
		});

		it('should clear specific flags', () => {
			element.markDirty(DirtyFlags.All);
			
			element.clearDirty(DirtyFlags.Geometry);
			
			expect(element.isDirty(DirtyFlags.Geometry)).toBe(false);
			expect(element.isDirty(DirtyFlags.Appearance)).toBe(true);
		});

		it('should combine multiple dirty flags', () => {
			element.clearDirty(DirtyFlags.All);
			
			element.markDirty(DirtyFlags.Geometry);
			element.markDirty(DirtyFlags.Appearance);
			
			expect(element.isDirty(DirtyFlags.Geometry | DirtyFlags.Appearance)).toBe(true);
		});
	});

	describe('bounds', () => {
		it('should calculate global bounds', () => {
			element.geometry = { left: 10, top: 20, width: 100, height: 50 };
			
			const bounds = element.getGlobalBounds();
			
			expect(bounds.min.x).toBe(10);
			expect(bounds.min.y).toBe(20);
			expect(bounds.max.x).toBe(110);
			expect(bounds.max.y).toBe(70);
		});

		it('should cache global bounds', () => {
			element.geometry = { left: 10, top: 20, width: 100, height: 50 };
			
			const bounds1 = element.getGlobalBounds();
			const bounds2 = element.getGlobalBounds();
			
			expect(bounds1).not.toBe(bounds2); // Should return clone
			expect(bounds1.min.x).toBe(bounds2.min.x);
		});
	});

	describe('hit testing', () => {
		beforeEach(() => {
			element.geometry = { left: 10, top: 20, width: 100, height: 50 };
		});

		it('should hit test correctly', () => {
			expect(element.hitTest(50, 40)).toBe(true); // Inside
			expect(element.hitTest(5, 40)).toBe(false); // Left of element
			expect(element.hitTest(120, 40)).toBe(false); // Right of element
			expect(element.hitTest(50, 10)).toBe(false); // Above element
			expect(element.hitTest(50, 80)).toBe(false); // Below element
		});

		it('should not hit test if not visible', () => {
			element.visible = false;
			expect(element.hitTest(50, 40)).toBe(false);
		});

		it('should not hit test if not interactive', () => {
			element.interactive = false;
			expect(element.hitTest(50, 40)).toBe(false);
		});
	});

	describe('lifecycle', () => {
		it('should emit mount event', () => {
			let mounted = false;
			element.on('mount', () => { mounted = true; });
			
			element.mount();
			
			expect(mounted).toBe(true);
		});

		it('should emit unmount event', () => {
			let unmounted = false;
			element.on('unmount', () => { unmounted = true; });
			
			element.unmount();
			
			expect(unmounted).toBe(true);
		});

		it('should clean up on destroy', () => {
			element.on('test', () => {});
			
			element.destroy();
			
			expect(element.parent).toBe(null);
			expect(element.view).toBe(null);
			expect(element.listenerCount('test')).toBe(0);
		});
	});
});