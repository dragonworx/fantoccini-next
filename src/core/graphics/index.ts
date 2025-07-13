/**
 * Main graphics library entry point and factory functions.
 * 
 * @namespace core.graphics
 * @memberof core
 */

// Core exports
export { View } from './views/View.js';
export { BaseElement } from './elements/BaseElement.js';
export { BoxElement } from './elements/BoxElement.js';
export { Layer, LayerManager } from './views/Layer.js';
export { LayerCompositor, AdvancedLayerCompositor } from './rendering/LayerCompositor.js';
export { FlexLayoutEngine, LayoutNode } from './layout/FlexLayout.js';
export { LayoutBinding, LayoutPropertyManager } from './layout/LayoutBinding.js';

// Type exports
export type { 
	Point, Size, Rectangle, Transform2D, Color, RGBA, Viewport, 
	InteractionEvent, ViewOptions, LayerOptions, EdgeValues, 
	CornerValues, Percentage, VisualProperties 
} from './types/GraphicsTypes.js';
export type { 
	ElementEventMap, MouseEventData, WheelEventData, TouchEventData, 
	KeyboardEventData, FocusEventData, LayoutChangeEventData, 
	LayoutCompleteEventData, ChildEventData, ParentChangeEventData, 
	VisibilityEventData, ViewportEventData, BaseElementOptions, 
	BoxElementOptions, ElementState, ComputedStyle, ElementConstructor
} from './types/ElementTypes.js';
export type { 
	LayoutResult, LayoutProperties, JustifyContent, AlignItems, FlexWrap,
	YogaNode, YogaConfig, YogaLayout, YogaSize, YogaMeasureFunc
} from './types/LayoutTypes.js';
export type { 
	RenderContext, RenderOptions, RenderStats, LayerCompositeOptions
} from './types/RenderTypes.js';

// Utility exports
export * from './utils/MathUtils.js';
export * from './utils/ColorUtils.js';

import { View } from './views/View.js';
import { BaseElement } from './elements/BaseElement.js';
import { BoxElement } from './elements/BoxElement.js';
import type { ViewOptions } from './types/GraphicsTypes.js';
import type { BoxElementOptions } from './types/ElementTypes.js';

/**
 * Creates a new graphics view with the specified dimensions.
 * 
 * @param width - View width in pixels
 * @param height - View height in pixels
 * @param options - Optional view configuration
 * @returns A new View instance
 * 
 * @example
 * ```typescript
 * import { createView } from '@core/graphics';
 * 
 * const view = createView(800, 600, {
 *   backgroundColor: '#f0f0f0',
 *   enableEvents: true
 * });
 * 
 * // Mount to DOM
 * view.mount(document.body);
 * 
 * // Create elements
 * const box = view.createElement(BoxElement, {
 *   layoutProperties: {
 *     width: 200,
 *     height: 100,
 *     margin: 10
 *   },
 *   backgroundColor: '#ff6b6b',
 *   content: 'Hello World!'
 * });
 * 
 * view.rootElement.appendChild(box);
 * ```
 */
export function createView(width: number, height: number, options?: ViewOptions): View {
	return new View(width, height, options);
}

/**
 * Creates a new box element with the specified options.
 * 
 * @param view - The view to create the element in
 * @param options - Element configuration options
 * @returns A new BoxElement instance
 * 
 * @example
 * ```typescript
 * const box = createBoxElement(view, {
 *   content: 'Click me!',
 *   backgroundColor: '#4ecdc4',
 *   textColor: '#ffffff',
 *   layoutProperties: {
 *     width: 150,
 *     height: 50,
 *     flexGrow: 1
 *   }
 * });
 * 
 * box.on('click', (event) => {
 *   console.log('Box clicked!', event);
 * });
 * ```
 */
export function createBoxElement(view: View, options?: BoxElementOptions): BoxElement {
	return new BoxElement(view, options);
}

/**
 * Applies layout properties to an element in a batch operation.
 * 
 * @param element - The element to update
 * @param properties - Layout properties to apply
 * 
 * @example
 * ```typescript
 * applyLayoutProperties(element, {
 *   width: 200,
 *   height: 100,
 *   flexDirection: 'column',
 *   justifyContent: 'center',
 *   alignItems: 'center',
 *   padding: 20
 * });
 * ```
 */
export function applyLayoutProperties(
	element: BaseElement, 
	properties: Partial<import('./types/LayoutTypes.js').LayoutProperties>
): void {
	element.setLayoutProperties(properties);
}

/**
 * Creates a simple flexbox layout container.
 * 
 * @param view - The view to create the container in
 * @param direction - Flex direction
 * @param options - Additional element options
 * @returns A configured box element
 * 
 * @example
 * ```typescript
 * const container = createFlexContainer(view, 'row', {
 *   backgroundColor: '#f8f9fa',
 *   layoutProperties: {
 *     width: '100%',
 *     height: 200,
 *     padding: 10,
 *     justifyContent: 'space-between'
 *   }
 * });
 * 
 * // Add flex items
 * const item1 = createBoxElement(view, { flexGrow: 1, content: 'Item 1' });
 * const item2 = createBoxElement(view, { flexGrow: 2, content: 'Item 2' });
 * 
 * container.appendChild(item1);
 * container.appendChild(item2);
 * ```
 */
export function createFlexContainer(
	view: View, 
	direction: 'row' | 'column' = 'row',
	options: BoxElementOptions = {}
): BoxElement {
	const layoutProperties = {
		flexDirection: direction,
		...options.layoutProperties
	};

	return createBoxElement(view, {
		...options,
		layoutProperties
	});
}

/**
 * Creates a grid-like layout using flexbox.
 * 
 * @param view - The view to create the grid in
 * @param columns - Number of columns
 * @param gap - Gap between items
 * @param options - Additional container options
 * @returns A configured container element
 * 
 * @example
 * ```typescript
 * const grid = createGridLayout(view, 3, 10, {
 *   layoutProperties: {
 *     width: '100%',
 *     padding: 20
 *   }
 * });
 * 
 * // Add grid items
 * for (let i = 0; i < 9; i++) {
 *   const item = createBoxElement(view, {
 *     content: `Item ${i + 1}`,
 *     backgroundColor: '#6c5ce7',
 *     textColor: '#ffffff',
 *     layoutProperties: {
 *       height: 80,
 *       margin: gap / 2
 *     }
 *   });
 *   
 *   grid.appendChild(item);
 * }
 * ```
 */
export function createGridLayout(
	view: View, 
	columns: number,
	gap: number = 0,
	options: BoxElementOptions = {}
): BoxElement {
	const container = createFlexContainer(view, 'column', {
		...options,
		layoutProperties: {
			flexWrap: 'wrap',
			...options.layoutProperties
		}
	});

	// Helper method to add grid items
	(container as any).addGridItem = (item: BoxElement) => {
		// Calculate flex-basis for the desired number of columns
		const itemWidth = `${(100 / columns) - (gap * (columns - 1) / columns)}%`;
		
		applyLayoutProperties(item, {
			flexBasis: itemWidth as any,
			margin: gap / 2
		});
		
		container.appendChild(item);
	};

	return container;
}

/**
 * Utility to measure text dimensions for layout purposes.
 * 
 * @param text - Text to measure
 * @param fontSize - Font size in pixels
 * @param fontFamily - Font family
 * @returns Text measurement data
 * 
 * @example
 * ```typescript
 * const textMeasurement = measureText('Hello World', 16, 'Arial');
 * 
 * const textBox = createBoxElement(view, {
 *   content: 'Hello World',
 *   layoutProperties: {
 *     width: textMeasurement.width + 20, // Add padding
 *     height: textMeasurement.height + 10
 *   }
 * });
 * ```
 */
export function measureText(
	text: string, 
	fontSize: number, 
	fontFamily: string = 'Arial, sans-serif'
): { width: number; height: number; ascent: number; descent: number } {
	// Create offscreen canvas for measurement
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d')!;
	
	context.font = `${fontSize}px ${fontFamily}`;
	const metrics = context.measureText(text);
	
	return {
		width: metrics.width,
		height: fontSize * 1.2, // Approximate line height
		ascent: metrics.actualBoundingBoxAscent || fontSize * 0.8,
		descent: metrics.actualBoundingBoxDescent || fontSize * 0.2
	};
}