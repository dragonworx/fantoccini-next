/**
 * Mathematical utility functions for graphics operations.
 * 
 * @namespace core.graphics
 * @memberof core
 */

import type { Point, Rectangle, Transform2D, EdgeValues, CornerValues } from '../types/GraphicsTypes.js';

/**
 * Clamps a number between min and max values.
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values.
 */
export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/**
 * Calculates the distance between two points.
 */
export function distance(p1: Point, p2: Point): number {
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the squared distance between two points (faster when comparing distances).
 */
export function distanceSquared(p1: Point, p2: Point): number {
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;
	return dx * dx + dy * dy;
}

/**
 * Checks if two rectangles intersect.
 */
export function rectanglesIntersect(r1: Rectangle, r2: Rectangle): boolean {
	return !(
		r1.x + r1.width < r2.x ||
		r1.x > r2.x + r2.width ||
		r1.y + r1.height < r2.y ||
		r1.y > r2.y + r2.height
	);
}

/**
 * Checks if a point is inside a rectangle.
 */
export function pointInRectangle(point: Point, rect: Rectangle): boolean {
	return (
		point.x >= rect.x &&
		point.x <= rect.x + rect.width &&
		point.y >= rect.y &&
		point.y <= rect.y + rect.height
	);
}

/**
 * Normalizes edge values to an object with all four edges.
 */
export function normalizeEdgeValues(value: EdgeValues): { top: number; right: number; bottom: number; left: number } {
	if (typeof value === 'number') {
		return { top: value, right: value, bottom: value, left: value };
	}
	return { ...value };
}

/**
 * Normalizes corner values to an object with all four corners.
 */
export function normalizeCornerValues(value: CornerValues): { 
	topLeft: number; 
	topRight: number; 
	bottomRight: number; 
	bottomLeft: number 
} {
	if (typeof value === 'number') {
		return { 
			topLeft: value, 
			topRight: value, 
			bottomRight: value, 
			bottomLeft: value 
		};
	}
	return { ...value };
}

/**
 * Creates a default transform.
 */
export function createTransform(): Transform2D {
	return {
		translateX: 0,
		translateY: 0,
		scaleX: 1,
		scaleY: 1,
		rotation: 0,
		skewX: 0,
		skewY: 0
	};
}

/**
 * Combines two transforms using matrix multiplication.
 */
export function combineTransforms(a: Transform2D, b: Transform2D): Transform2D {
	// Convert to matrix form for accurate combination
	const matrix1 = transformToMatrix(a);
	const matrix2 = transformToMatrix(b);
	const combined = multiplyMatrices(matrix1, matrix2);
	return matrixToTransform(combined);
}

/**
 * Converts a transform to a 2D transformation matrix.
 */
export function transformToMatrix(transform: Transform2D): number[] {
	const { translateX, translateY, scaleX, scaleY, rotation, skewX, skewY } = transform;
	
	const cos = Math.cos(rotation);
	const sin = Math.sin(rotation);
	const tanX = Math.tan(skewX);
	const tanY = Math.tan(skewY);
	
	// Apply transformations in order: scale, skew, rotate, translate
	return [
		scaleX * cos + tanY * scaleY * sin,
		scaleX * sin - tanY * scaleY * cos,
		tanX * scaleX * cos + scaleY * sin,
		tanX * scaleX * sin + scaleY * cos,
		translateX,
		translateY
	];
}

/**
 * Converts a 2D transformation matrix back to a transform object.
 */
export function matrixToTransform(matrix: number[]): Transform2D {
	const [a, b, c, d, e, f] = matrix;
	
	// Extract scale
	const scaleX = Math.sqrt(a * a + b * b);
	const scaleY = Math.sqrt(c * c + d * d);
	
	// Extract rotation
	const rotation = Math.atan2(b, a);
	
	// Extract skew (simplified)
	const skewX = Math.atan2(c, d) - rotation;
	const skewY = 0; // Simplified for now
	
	return {
		translateX: e,
		translateY: f,
		scaleX,
		scaleY,
		rotation,
		skewX,
		skewY
	};
}

/**
 * Multiplies two 2D transformation matrices.
 */
export function multiplyMatrices(a: number[], b: number[]): number[] {
	const [a1, b1, c1, d1, e1, f1] = a;
	const [a2, b2, c2, d2, e2, f2] = b;
	
	return [
		a1 * a2 + b1 * c2,
		a1 * b2 + b1 * d2,
		c1 * a2 + d1 * c2,
		c1 * b2 + d1 * d2,
		e1 * a2 + f1 * c2 + e2,
		e1 * b2 + f1 * d2 + f2
	];
}

/**
 * Transforms a point using a transform object.
 */
export function transformPoint(point: Point, transform: Transform2D): Point {
	const matrix = transformToMatrix(transform);
	const [a, b, c, d, e, f] = matrix;
	
	return {
		x: a * point.x + c * point.y + e,
		y: b * point.x + d * point.y + f
	};
}

/**
 * Calculates the bounding box of a rectangle after transformation.
 */
export function transformRectangle(rect: Rectangle, transform: Transform2D): Rectangle {
	const corners = [
		{ x: rect.x, y: rect.y },
		{ x: rect.x + rect.width, y: rect.y },
		{ x: rect.x + rect.width, y: rect.y + rect.height },
		{ x: rect.x, y: rect.y + rect.height }
	];
	
	const transformedCorners = corners.map(corner => transformPoint(corner, transform));
	
	const xs = transformedCorners.map(p => p.x);
	const ys = transformedCorners.map(p => p.y);
	
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	
	return {
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY
	};
}

/**
 * Rounds a number to a specific decimal place.
 */
export function round(value: number, decimals: number = 0): number {
	const factor = Math.pow(10, decimals);
	return Math.round(value * factor) / factor;
}

/**
 * Checks if two numbers are approximately equal within a tolerance.
 */
export function approximately(a: number, b: number, tolerance: number = 1e-10): boolean {
	return Math.abs(a - b) < tolerance;
}

/**
 * Converts degrees to radians.
 */
export function degreesToRadians(degrees: number): number {
	return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees.
 */
export function radiansToDegrees(radians: number): number {
	return radians * (180 / Math.PI);
}