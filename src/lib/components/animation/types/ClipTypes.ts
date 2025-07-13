/**
 * Types for the clip-based animation system
 * @module ClipTypes
 * @memberof editor
 */

import type { KeyframeOptimizationParams } from '../../keyframe-optimizer/types/KeyframeOptimizerTypes.js';

/**
 * Raw data point captured during recording
 */
export interface RawDataPoint {
	time: number; // Local time within the clip
	value: number;
	timestamp: number; // High-precision timestamp for ordering
}

/**
 * Metadata for a clip
 */
export interface ClipMetadata {
	/** Unique identifier for the clip */
	id: string;
	/** Human-readable name for the clip */
	name: string;
	/** When the clip was created */
	createdAt: number;
	/** When the clip was last modified */
	modifiedAt: number;
	/** Original recording parameters */
	recordingParams: {
		sampleRate: number;
		startTime: number;
		endTime: number;
		totalSamples: number;
	};
	/** Last optimization parameters used */
	lastOptimizationParams: KeyframeOptimizationParams;
	/** Tags for organizing clips */
	tags: string[];
}

/**
 * A clip contains raw data and generates keyframes
 */
export interface IClip {
	/** Unique identifier */
	readonly id: string;
	/** Clip metadata */
	readonly metadata: ClipMetadata;
	/** Start time relative to the timeline */
	readonly startOffset: number;
	/** Duration of the clip */
	readonly duration: number;
	/** Raw data points captured during recording */
	readonly rawData: RawDataPoint[];
	/** Generated keyframes with clip references */
	readonly keyframes: ClipKeyframe[];
	/** Whether the clip is enabled */
	enabled: boolean;
	/** Whether the clip is muted */
	muted: boolean;
	
	/**
	 * Generate keyframes from raw data with given parameters
	 */
	generateKeyframes(params?: Partial<KeyframeOptimizationParams>): ClipKeyframe[];
	
	/**
	 * Clear all generated keyframes
	 */
	clearKeyframes(): void;
	
	/**
	 * Get value at specific time using keyframe interpolation
	 */
	getValueAtTime(time: number): number;
	
	/**
	 * Check if clip is active at given time
	 */
	isActiveAtTime(time: number): boolean;
	
	/**
	 * Get local time from global time
	 */
	getLocalTime(globalTime: number): number;
	
	/**
	 * Get global time from local time
	 */
	getGlobalTime(localTime: number): number;
	
	/**
	 * Clone the clip with new parameters
	 */
	clone(overrides?: Partial<ClipMetadata>): IClip;
	
	/**
	 * Dispose of the clip
	 */
	dispose(): void;
	
	/**
	 * Event emitter methods
	 */
	on<K extends keyof ClipEventMap>(event: K, listener: (data: ClipEventMap[K]) => void): void;
	off<K extends keyof ClipEventMap>(event: K, listener?: (data: ClipEventMap[K]) => void): void;
}

/**
 * Keyframe that references its source clip
 */
export interface ClipKeyframe {
	/** Unique identifier for the keyframe */
	id: string;
	/** Time position of the keyframe */
	time: number;
	/** Value at this keyframe */
	value: number;
	/** Interpolation type */
	interpolation: string;
	/** Reference to the clip that generated this keyframe */
	clipId: string;
	/** Index of this keyframe within the clip */
	clipIndex: number;
	/** Whether this keyframe was generated or manually created */
	isGenerated: boolean;
}

/**
 * Animatable property that manages clips
 */
export interface IAnimatableProperty {
	/** Property name (e.g., 'x', 'y', 'rotation') */
	readonly name: string;
	/** Current value of the property */
	value: number;
	/** Clips that affect this property, sorted by start offset */
	readonly clips: IClip[];
	/** All keyframes from all clips, sorted by time */
	readonly keyframes: ClipKeyframe[];
	
	/**
	 * Add a clip to the property
	 */
	addClip(clip: IClip): void;
	
	/**
	 * Remove a clip from the property
	 */
	removeClip(clipId: string): void;
	
	/**
	 * Get clip by ID
	 */
	getClip(clipId: string): IClip | undefined;
	
	/**
	 * Get value at specific time considering all clips
	 */
	getValueAtTime(time: number): number;
	
	/**
	 * Get all active clips at given time
	 */
	getActiveClipsAtTime(time: number): IClip[];
	
	/**
	 * Regenerate keyframes for all clips
	 */
	regenerateAllKeyframes(): void;
	
	/**
	 * Clear all keyframes
	 */
	clearAllKeyframes(): void;
	
	/**
	 * Dispose of the property
	 */
	dispose(): void;
}

/**
 * Events emitted by clips
 */
export interface ClipEventMap {
	[key: string]: unknown;
	'clip:keyframes-generated': { clip: IClip; keyframes: ClipKeyframe[] };
	'clip:keyframes-cleared': { clip: IClip };
	'clip:enabled-changed': { clip: IClip; enabled: boolean };
	'clip:muted-changed': { clip: IClip; muted: boolean };
}

/**
 * Events emitted by animatable properties
 */
export interface AnimatablePropertyEventMap {
	[key: string]: unknown;
	'property:clip-added': { property: IAnimatableProperty; clip: IClip };
	'property:clip-removed': { property: IAnimatableProperty; clipId: string };
	'property:value-changed': { property: IAnimatableProperty; value: number; time: number };
	'property:keyframes-updated': { property: IAnimatableProperty; keyframes: ClipKeyframe[] };
}

/**
 * Configuration for creating a clip
 */
export interface ClipConfig {
	/** Clip name */
	name: string;
	/** Start offset relative to timeline */
	startOffset: number;
	/** Raw data points */
	rawData: RawDataPoint[];
	/** Initial optimization parameters */
	optimizationParams?: Partial<KeyframeOptimizationParams>;
	/** Whether clip is enabled */
	enabled?: boolean;
	/** Whether clip is muted */
	muted?: boolean;
	/** Tags for organizing */
	tags?: string[];
}

/**
 * Configuration for creating an animatable property
 */
export interface AnimatablePropertyConfig {
	/** Initial value */
	initialValue?: number;
	/** Initial clips */
	clips?: IClip[];
}