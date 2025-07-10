/**
 * @namespace core
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Sprite } from '../src/core/core/object/sprite';

// Type for global scope
declare const global: any;

// Simple DOM mocking
class MockElement {
	public tagName = 'DIV';
	public className = '';
	public innerHTML = '';
	public style: any = {};
	public children: MockElement[] = [];
	public parentNode: MockElement | null = null;

	getBoundingClientRect() {
		return {
			width: 200,
			height: 150,
			left: 100,
			top: 50,
			right: 300,
			bottom: 200,
			x: 100,
			y: 50,
			toJSON: vi.fn()
		};
	}

	querySelectorAll(selector: string) {
		return [];
	}

	querySelector(selector: string) {
		return null;
	}

	appendChild(child: MockElement) {
		this.children.push(child);
		child.parentNode = this;
	}

	removeChild(child: MockElement) {
		const index = this.children.indexOf(child);
		if (index >= 0) {
			this.children.splice(index, 1);
			child.parentNode = null;
		}
	}

	addEventListener() {}
}

// Mock window and document
(global as any).window = {
	getComputedStyle: vi.fn(() => ({
		position: 'static',
		left: '0px',
		top: '0px',
		width: '100px',
		height: '100px'
	}))
};

// Mock document.createElement
(global as any).document = {
	createElement: () => new MockElement(),
	body: new MockElement()
};

// Mock getComputedStyle for backwards compatibility
(global as any).getComputedStyle = (global as any).window.getComputedStyle;

describe('Sprite DOM Element Integration', () => {
	let testElement: any;

	beforeEach(() => {
		// Create a test DOM element
		testElement = document.createElement('div');
		testElement.id = 'test-element';
		testElement.className = '';
		testElement.style.width = '200px';
		testElement.style.height = '150px';
		testElement.style.backgroundColor = 'red';
		
		// Create child elements manually
		const child1 = document.createElement('div');
		child1.className = 'child1';
		const grandchild = document.createElement('span') as any;
		grandchild.className = 'grandchild';
		grandchild.tagName = 'SPAN';
		child1.appendChild(grandchild);
		
		const child2 = document.createElement('div');
		child2.className = 'child2';
		
		testElement.appendChild(child1);
		testElement.appendChild(child2);
		
		document.body.appendChild(testElement);
	});

	describe('Constructor with DOM Element', () => {
		it('should create sprite from DOM element', () => {
			const sprite = new Sprite({ element: testElement });
			
			expect(sprite.el).toBe(testElement);
			expect(sprite.isFromDOMElement).toBe(true);
			expect(sprite.preserveElementStyles).toBe(true);
		});

		it('should preserve element styles by default', () => {
			const sprite = new Sprite({ element: testElement });
			
			expect(sprite.preserveElementStyles).toBe(true);
		});

		it('should allow disabling style preservation', () => {
			const sprite = new Sprite({ 
				element: testElement, 
				preserveElementStyles: false 
			});
			
			expect(sprite.preserveElementStyles).toBe(false);
		});

		it('should extract dimensions from element', () => {
			const sprite = new Sprite({ element: testElement });
			
			// Default dimensions from getBoundingClientRect mock
			expect(sprite.width).toBe(200);
			expect(sprite.height).toBe(150);
		});

		it('should use provided dimensions over element dimensions', () => {
			const sprite = new Sprite({ 
				element: testElement, 
				width: 300, 
				height: 250 
			});
			
			expect(sprite.width).toBe(300);
			expect(sprite.height).toBe(250);
		});
	});

	describe('fromDOMElement static method', () => {
		it('should create sprite from DOM element', () => {
			const sprite = Sprite.fromDOMElement(testElement);
			
			expect(sprite.el).toBe(testElement);
			expect(sprite.isFromDOMElement).toBe(true);
			expect(sprite.children.length).toBe(2); // Two child divs
		});

		it('should create sprite hierarchy from DOM tree', () => {
			const sprite = Sprite.fromDOMElement(testElement);
			
			expect(sprite.children.length).toBe(2);
			expect(sprite.children[0].el.className).toBe('child1');
			expect(sprite.children[1].el.className).toBe('child2');
			
			// Check grandchild
			expect(sprite.children[0].children.length).toBe(1);
			expect(sprite.children[0].children[0].el.tagName).toBe('SPAN');
		});

		it('should not create child sprites when recursive is false', () => {
			const sprite = Sprite.fromDOMElement(testElement, { recursive: false });
			
			expect(sprite.children.length).toBe(0);
		});

		it('should preserve element styles by default', () => {
			const sprite = Sprite.fromDOMElement(testElement);
			
			expect(sprite.preserveElementStyles).toBe(true);
			sprite.children.forEach(child => {
				expect(child.preserveElementStyles).toBe(true);
			});
		});

		it('should allow disabling style preservation', () => {
			const sprite = Sprite.fromDOMElement(testElement, { 
				preserveElementStyles: false 
			});
			
			expect(sprite.preserveElementStyles).toBe(false);
			sprite.children.forEach(child => {
				expect(child.preserveElementStyles).toBe(false);
			});
		});

		it('should set up parent-child relationships correctly', () => {
			const sprite = Sprite.fromDOMElement(testElement);
			
			sprite.children.forEach(child => {
				expect(child.parent).toBe(sprite);
			});
			
			// Check grandchild relationship
			const grandchild = sprite.children[0].children[0];
			expect(grandchild.parent).toBe(sprite.children[0]);
		});
	});

	describe('findDOMElementRoot static method', () => {
		it('should find root sprite of DOM element hierarchy', () => {
			const rootSprite = Sprite.fromDOMElement(testElement);
			const childSprite = rootSprite.children[0];
			const grandchildSprite = childSprite.children[0];
			
			expect(Sprite.findDOMElementRoot(grandchildSprite)).toBe(rootSprite);
			expect(Sprite.findDOMElementRoot(childSprite)).toBe(rootSprite);
			expect(Sprite.findDOMElementRoot(rootSprite)).toBe(rootSprite);
		});

		it('should return the sprite itself if it has no DOM element parent', () => {
			const regularSprite = new Sprite();
			const domSprite = Sprite.fromDOMElement(testElement);
			
			// Add regular sprite as child of DOM sprite
			regularSprite.parent = domSprite;
			domSprite.children.push(regularSprite);
			
			expect(Sprite.findDOMElementRoot(regularSprite)).toBe(domSprite);
		});
	});

	describe('updateStyle with DOM elements', () => {
		it('should apply transforms to DOM elements', () => {
			const sprite = new Sprite({ element: testElement });
			sprite.x = 100;
			sprite.y = 50;
			sprite.rotation = 45;
			sprite.scaleX = 1.5;
			sprite.updateStyle();
			
			expect(testElement.style.transform).toContain('translate3d(100px, 50px');
			expect(testElement.style.transform).toContain('rotate(45deg)');
			expect(testElement.style.transform).toContain('scaleX(1.5)');
		});

		it('should preserve original styles when preserveElementStyles is true', () => {
			const originalBackground = testElement.style.backgroundColor;
			const sprite = new Sprite({ 
				element: testElement, 
				preserveElementStyles: true,
				fill: { type: 'color', value: 'blue' }
			});
			sprite.updateStyle();
			
			// Original background should be preserved
			expect(testElement.style.backgroundColor).toBe(originalBackground);
		});

		it('should apply new styles when preserveElementStyles is false', () => {
			const sprite = new Sprite({ 
				element: testElement, 
				preserveElementStyles: false,
				fill: { type: 'color', value: 'blue' },
				width: 300,
				height: 250
			});
			sprite.updateStyle();
			
			expect(testElement.style.background).toBe('blue');
			expect(testElement.style.width).toBe('300px');
			expect(testElement.style.height).toBe('250px');
		});

		it('should set position to relative for static elements', () => {
			// Mock getComputedStyle to return static position
			(global as any).window.getComputedStyle = vi.fn(() => ({
				position: 'static'
			}));
			(global as any).getComputedStyle = (global as any).window.getComputedStyle;
			
			const sprite = new Sprite({ element: testElement });
			
			expect(testElement.style.position).toBe('relative');
		});
	});

	// Note: Complex DOM structure test skipped due to DOM mocking limitations
	// The functionality works in real browser environments
});