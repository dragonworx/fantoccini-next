/* eslint-disable no-var */
/* eslint-disable no-undef */

declare global {
	// DOM types
	interface HTMLCanvasElement extends HTMLElement {}
	interface MouseEvent extends Event {}
	interface TouchEvent extends Event {
		touches: TouchList;
	}
	interface TouchList {
		length: number;
		[index: number]: Touch;
	}
	interface Touch {
		clientX: number;
		clientY: number;
	}
	interface DOMRect {
		left: number;
		top: number;
		width: number;
		height: number;
		right: number;
		bottom: number;
	}
	interface CanvasRenderingContext2D {}
	
	// Global functions
	var document: {
		createElement(tagName: 'canvas'): HTMLCanvasElement;
	};
}

export {};