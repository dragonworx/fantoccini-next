/**
 * @fileoverview Shared utilities for UI library demos
 * @namespace editor
 * @memberof editor
 */

import { View, Container } from '$core/ui';

/**
 * Common configuration for demo canvases
 */
export interface DemoConfig {
	width?: number;
	height?: number;
	backgroundColor?: string;
	padding?: number;
}

/**
 * Default demo configuration
 */
const DEFAULT_CONFIG: Required<DemoConfig> = {
	width: 800,
	height: 600,
	backgroundColor: '#f0f0f0',
	padding: 20
};

/**
 * Creates a demo container with standard styling
 * @memberof editor
 */
export function createDemoContainer(config: DemoConfig = {}): HTMLDivElement {
	const mergedConfig = { ...DEFAULT_CONFIG, ...config };
	const container = document.createElement('div');
	
	container.style.cssText = `
		width: 100%;
		max-width: ${mergedConfig.width}px;
		margin: 0 auto;
		padding: ${mergedConfig.padding}px;
		background-color: ${mergedConfig.backgroundColor};
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	`;
	
	return container;
}

/**
 * Sets up a canvas element with standard configuration
 * @memberof editor
 */
export function setupCanvas(
	container: HTMLElement,
	config: DemoConfig = {}
): HTMLCanvasElement {
	const mergedConfig = { ...DEFAULT_CONFIG, ...config };
	const canvas = document.createElement('canvas');
	
	canvas.width = mergedConfig.width - (mergedConfig.padding * 2);
	canvas.height = mergedConfig.height - (mergedConfig.padding * 2);
	canvas.style.cssText = `
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid #ddd;
		background-color: white;
		border-radius: 4px;
	`;
	
	container.appendChild(canvas);
	return canvas;
}

/**
 * Initializes a View instance with a canvas
 * @memberof editor
 */
export function initializeView(canvas: HTMLCanvasElement): View {
	const view = new View(canvas);
	
	// Create and set root container
	const root = new Container({
		width: canvas.width,
		height: canvas.height
	});
	view.setRoot(root);
	
	return view;
}


/**
 * Adds demo information/description to the container
 * @memberof editor
 */
export function addDemoInfo(
	container: HTMLElement,
	title: string,
	description: string
): void {
	const infoDiv = document.createElement('div');
	infoDiv.style.cssText = `
		margin-bottom: 20px;
		padding: 15px;
		background-color: #f8f9fa;
		border-left: 4px solid #007bff;
		border-radius: 4px;
	`;
	
	const titleEl = document.createElement('h2');
	titleEl.textContent = title;
	titleEl.style.cssText = `
		margin: 0 0 10px 0;
		color: #333;
		font-size: 1.5rem;
	`;
	
	const descEl = document.createElement('p');
	descEl.textContent = description;
	descEl.style.cssText = `
		margin: 0;
		color: #666;
		line-height: 1.5;
	`;
	
	infoDiv.appendChild(titleEl);
	infoDiv.appendChild(descEl);
	container.insertBefore(infoDiv, container.firstChild);
}

/**
 * Creates a standard demo setup with all components
 * @memberof editor
 * @example
 * const demo = createStandardDemo({
 *   title: 'Basic UI Demo',
 *   description: 'Shows basic rectangle rendering',
 *   canvasConfig: { width: 600, height: 400 }
 * });
 * 
 * // Access components
 * const { container, canvas, fantoccini, view } = demo;
 */
export interface StandardDemoOptions {
	title: string;
	description: string;
	containerConfig?: DemoConfig;
	canvasConfig?: DemoConfig;
	viewName?: string;
}

export interface StandardDemo {
	container: HTMLDivElement;
	canvas: HTMLCanvasElement;
	view: View;
}

export function createStandardDemo(options: StandardDemoOptions): StandardDemo {
	const container = createDemoContainer(options.containerConfig);
	addDemoInfo(container, options.title, options.description);
	
	const canvas = setupCanvas(container, options.canvasConfig);
	const view = initializeView(canvas);
	
	return {
		container,
		canvas,
		view
	};
}