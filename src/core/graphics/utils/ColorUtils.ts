/**
 * Color manipulation utility functions.
 * 
 * @namespace core.graphics
 * @memberof core
 */

import type { Color, RGBA } from '../types/GraphicsTypes.js';

/**
 * Parses a CSS color string to RGBA values.
 */
export function parseColor(color: string): RGBA {
	// Handle hex colors
	if (color.startsWith('#')) {
		return parseHexColor(color);
	}
	
	// Handle rgb/rgba colors
	if (color.startsWith('rgb')) {
		return parseRgbColor(color);
	}
	
	// Handle hsl/hsla colors
	if (color.startsWith('hsl')) {
		return parseHslColor(color);
	}
	
	// Handle named colors
	const namedColor = parseNamedColor(color);
	if (namedColor) {
		return namedColor;
	}
	
	// Default to black if parsing fails
	console.warn(`Could not parse color: ${color}`);
	return { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Parses a hex color string (#RGB, #RRGGBB, #RGBA, #RRGGBBAA).
 */
function parseHexColor(hex: string): RGBA {
	const cleaned = hex.replace('#', '');
	
	if (cleaned.length === 3) {
		// #RGB
		const r = parseInt(cleaned[0] + cleaned[0], 16);
		const g = parseInt(cleaned[1] + cleaned[1], 16);
		const b = parseInt(cleaned[2] + cleaned[2], 16);
		return { r, g, b, a: 1 };
	}
	
	if (cleaned.length === 4) {
		// #RGBA
		const r = parseInt(cleaned[0] + cleaned[0], 16);
		const g = parseInt(cleaned[1] + cleaned[1], 16);
		const b = parseInt(cleaned[2] + cleaned[2], 16);
		const a = parseInt(cleaned[3] + cleaned[3], 16) / 255;
		return { r, g, b, a };
	}
	
	if (cleaned.length === 6) {
		// #RRGGBB
		const r = parseInt(cleaned.substring(0, 2), 16);
		const g = parseInt(cleaned.substring(2, 4), 16);
		const b = parseInt(cleaned.substring(4, 6), 16);
		return { r, g, b, a: 1 };
	}
	
	if (cleaned.length === 8) {
		// #RRGGBBAA
		const r = parseInt(cleaned.substring(0, 2), 16);
		const g = parseInt(cleaned.substring(2, 4), 16);
		const b = parseInt(cleaned.substring(4, 6), 16);
		const a = parseInt(cleaned.substring(6, 8), 16) / 255;
		return { r, g, b, a };
	}
	
	throw new Error(`Invalid hex color: ${hex}`);
}

/**
 * Parses an RGB/RGBA color string.
 */
function parseRgbColor(rgb: string): RGBA {
	const match = rgb.match(/rgba?\(([^)]+)\)/);
	if (!match) {
		throw new Error(`Invalid RGB color: ${rgb}`);
	}
	
	const values = match[1].split(',').map(v => v.trim());
	const r = parseInt(values[0], 10);
	const g = parseInt(values[1], 10);
	const b = parseInt(values[2], 10);
	const a = values[3] ? parseFloat(values[3]) : 1;
	
	return { r, g, b, a };
}

/**
 * Parses an HSL/HSLA color string.
 */
function parseHslColor(hsl: string): RGBA {
	const match = hsl.match(/hsla?\(([^)]+)\)/);
	if (!match) {
		throw new Error(`Invalid HSL color: ${hsl}`);
	}
	
	const values = match[1].split(',').map(v => v.trim());
	const h = parseInt(values[0], 10) / 360;
	const s = parseInt(values[1].replace('%', ''), 10) / 100;
	const l = parseInt(values[2].replace('%', ''), 10) / 100;
	const a = values[3] ? parseFloat(values[3]) : 1;
	
	const { r, g, b } = hslToRgb(h, s, l);
	return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a };
}

/**
 * Converts HSL to RGB.
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
	let r: number, g: number, b: number;
	
	if (s === 0) {
		r = g = b = l; // Achromatic
	} else {
		const hue2rgb = (p: number, q: number, t: number): number => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1/6) return p + (q - p) * 6 * t;
			if (t < 1/2) return q;
			if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		};
		
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}
	
	return { r, g, b };
}

/**
 * Basic named color support.
 */
function parseNamedColor(name: string): RGBA | null {
	const namedColors: Record<string, RGBA> = {
		black: { r: 0, g: 0, b: 0, a: 1 },
		white: { r: 255, g: 255, b: 255, a: 1 },
		red: { r: 255, g: 0, b: 0, a: 1 },
		green: { r: 0, g: 128, b: 0, a: 1 },
		blue: { r: 0, g: 0, b: 255, a: 1 },
		yellow: { r: 255, g: 255, b: 0, a: 1 },
		cyan: { r: 0, g: 255, b: 255, a: 1 },
		magenta: { r: 255, g: 0, b: 255, a: 1 },
		transparent: { r: 0, g: 0, b: 0, a: 0 }
	};
	
	return namedColors[name.toLowerCase()] || null;
}

/**
 * Converts RGBA values to a CSS color string.
 */
export function rgbaToString(rgba: RGBA): string {
	const { r, g, b, a } = rgba;
	if (a === 1) {
		return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
	}
	return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

/**
 * Converts RGBA values to a hex color string.
 */
export function rgbaToHex(rgba: RGBA): string {
	const { r, g, b, a } = rgba;
	const rHex = Math.round(r).toString(16).padStart(2, '0');
	const gHex = Math.round(g).toString(16).padStart(2, '0');
	const bHex = Math.round(b).toString(16).padStart(2, '0');
	
	if (a === 1) {
		return `#${rHex}${gHex}${bHex}`;
	}
	
	const aHex = Math.round(a * 255).toString(16).padStart(2, '0');
	return `#${rHex}${gHex}${bHex}${aHex}`;
}

/**
 * Interpolates between two colors.
 */
export function interpolateColor(color1: RGBA, color2: RGBA, t: number): RGBA {
	const clampedT = Math.max(0, Math.min(1, t));
	
	return {
		r: color1.r + (color2.r - color1.r) * clampedT,
		g: color1.g + (color2.g - color1.g) * clampedT,
		b: color1.b + (color2.b - color1.b) * clampedT,
		a: color1.a + (color2.a - color1.a) * clampedT
	};
}

/**
 * Adjusts the alpha channel of a color.
 */
export function withAlpha(color: RGBA, alpha: number): RGBA {
	return { ...color, a: Math.max(0, Math.min(1, alpha)) };
}

/**
 * Lightens a color by a given amount.
 */
export function lighten(color: RGBA, amount: number): RGBA {
	const factor = 1 + Math.max(-1, Math.min(1, amount));
	return {
		r: Math.min(255, color.r * factor),
		g: Math.min(255, color.g * factor),
		b: Math.min(255, color.b * factor),
		a: color.a
	};
}

/**
 * Darkens a color by a given amount.
 */
export function darken(color: RGBA, amount: number): RGBA {
	return lighten(color, -amount);
}

/**
 * Creates a gradient between multiple colors.
 */
export function createGradient(
	context: CanvasRenderingContext2D,
	type: 'linear' | 'radial',
	colors: { color: RGBA; stop: number }[],
	...args: number[]
): CanvasGradient {
	let gradient: CanvasGradient;
	
	if (type === 'linear') {
		const [x0, y0, x1, y1] = args;
		gradient = context.createLinearGradient(x0, y0, x1, y1);
	} else {
		const [x0, y0, r0, x1, y1, r1] = args;
		gradient = context.createRadialGradient(x0, y0, r0, x1, y1, r1);
	}
	
	colors.forEach(({ color, stop }) => {
		gradient.addColorStop(stop, rgbaToString(color));
	});
	
	return gradient;
}