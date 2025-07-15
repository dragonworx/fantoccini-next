import * as THREE from 'three';

/**
 * CSS-like styling interface for 2D sprites.
 * 
 * @interface StyleSheet
 * @memberof ui-system.styling
 */
export interface StyleSheet {
	// Fill properties
	backgroundColor?: string | THREE.Color;
	backgroundOpacity?: number;
	backgroundTexture?: THREE.Texture;
	
	// Border properties
	borderWidth?: number;
	borderColor?: string | THREE.Color;
	borderOpacity?: number;
	borderStyle?: 'solid' | 'dashed' | 'dotted';
	borderRadius?: number;
	
	// Layout properties
	opacity?: number;
	visible?: boolean;
	
	// Transform properties
	transform?: string; // CSS transform syntax support
}

/**
 * Theme configuration interface.
 * 
 * @interface ThemeConfig
 * @memberof ui-system.styling
 */
export interface ThemeConfig {
	name: string;
	colors: {
		primary: string;
		secondary: string;
		background: string;
		surface: string;
		error: string;
		warning: string;
		info: string;
		success: string;
		text: {
			primary: string;
			secondary: string;
			disabled: string;
		};
	};
	typography: {
		fontFamily: string;
		fontSize: {
			small: number;
			medium: number;
			large: number;
		};
	};
	spacing: {
		unit: number;
	};
	borderRadius: {
		small: number;
		medium: number;
		large: number;
	};
}