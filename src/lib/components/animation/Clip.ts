/**
 * Clip implementation for storing raw data and generating keyframes
 * @module Clip
 * @memberof editor
 */

import { EventEmitter } from '../../../core/event-emitter.js';
import { KeyframeOptimizer } from '../keyframe-optimizer/KeyframeOptimizer.js';
import { DEFAULT_OPTIMIZATION_PARAMS } from '../keyframe-optimizer/types/KeyframeOptimizerTypes.js';
import { generateId } from '../timeline/utils/TimelineUtils.js';
import type { 
	IClip, 
	ClipMetadata, 
	RawDataPoint, 
	ClipKeyframe, 
	ClipEventMap, 
	ClipConfig 
} from './types/ClipTypes.js';
import type { KeyframeOptimizationParams } from '../keyframe-optimizer/types/KeyframeOptimizerTypes.js';

/**
 * Clip class that stores raw data and generates keyframes
 */
export class Clip extends EventEmitter<ClipEventMap> implements IClip {
	private _metadata: ClipMetadata;
	private _rawData: RawDataPoint[];
	private _keyframes: ClipKeyframe[] = [];
	private _enabled: boolean = true;
	private _muted: boolean = false;
	private _optimizer: KeyframeOptimizer;

	public constructor(
		private _startOffset: number,
		private _duration: number,
		config: ClipConfig
	) {
		super();
		
		// Initialize metadata
		this._metadata = {
			id: generateId('clip'),
			name: config.name,
			createdAt: Date.now(),
			modifiedAt: Date.now(),
			recordingParams: {
				sampleRate: config.rawData.length / _duration,
				startTime: _startOffset,
				endTime: _startOffset + _duration,
				totalSamples: config.rawData.length
			},
			lastOptimizationParams: { ...DEFAULT_OPTIMIZATION_PARAMS, ...config.optimizationParams },
			tags: config.tags || []
		};

		// Store raw data
		this._rawData = [...config.rawData];
		
		// Set initial state
		this._enabled = config.enabled ?? true;
		this._muted = config.muted ?? false;
		
		// Initialize optimizer
		this._optimizer = new KeyframeOptimizer();
		
		// Generate initial keyframes if we have data
		if (this._rawData.length > 0) {
			this.generateKeyframes(config.optimizationParams);
		}
	}

	public get id(): string {
		return this._metadata.id;
	}

	public get metadata(): ClipMetadata {
		return { ...this._metadata };
	}

	public get startOffset(): number {
		return this._startOffset;
	}

	public get duration(): number {
		return this._duration;
	}

	public get rawData(): RawDataPoint[] {
		return [...this._rawData];
	}

	public get keyframes(): ClipKeyframe[] {
		return [...this._keyframes];
	}

	public get enabled(): boolean {
		return this._enabled;
	}

	public set enabled(value: boolean) {
		if (this._enabled !== value) {
			this._enabled = value;
			this.emitEvent('clip:enabled-changed', { clip: this, enabled: value });
		}
	}

	public get muted(): boolean {
		return this._muted;
	}

	public set muted(value: boolean) {
		if (this._muted !== value) {
			this._muted = value;
			this.emitEvent('clip:muted-changed', { clip: this, muted: value });
		}
	}

	public generateKeyframes(params?: Partial<KeyframeOptimizationParams>): ClipKeyframe[] {
		if (this._rawData.length === 0) {
			return [];
		}

		const optimizationParams = { ...DEFAULT_OPTIMIZATION_PARAMS, ...params };
		
		// Update metadata
		this._metadata.lastOptimizationParams = optimizationParams;
		this._metadata.modifiedAt = Date.now();

		try {
			// Start recording with optimizer
			this._optimizer.startRecording(['value']);
			
			// Feed raw data to optimizer
			for (const point of this._rawData) {
				this._optimizer.captureDataPoint('value', point.time, point.value);
			}
			
			// Stop recording and optimize
			this._optimizer.stopRecording();
			const result = this._optimizer.optimizeToKeyframes('value', optimizationParams);
			
			// Convert to ClipKeyframes with global time
			const newKeyframes: ClipKeyframe[] = result.keyframes.map((kf, index) => ({
				id: generateId('keyframe'),
				time: this._startOffset + kf.time, // Convert to global time
				value: kf.value,
				interpolation: 'Linear',
				clipId: this.id,
				clipIndex: index,
				isGenerated: true
			}));
			
			// Replace existing keyframes
			this._keyframes = newKeyframes;
			
			// Clear optimizer data
			this._optimizer.clearAllRawData();
			
			// Emit event
			this.emitEvent('clip:keyframes-generated', { clip: this, keyframes: this._keyframes });
			
			return [...this._keyframes];
			
		} catch (error) {
			console.error('Failed to generate keyframes for clip:', this.id, error);
			return [];
		}
	}

	public clearKeyframes(): void {
		this._keyframes = [];
		this.emitEvent('clip:keyframes-cleared', { clip: this });
	}

	public getValueAtTime(time: number): number {
		if (!this.isActiveAtTime(time) || this._muted || !this._enabled) {
			return 0; // Return neutral value if not active
		}

		if (this._keyframes.length === 0) {
			return 0;
		}

		// Find keyframes around the time
		const activeKeyframes = this._keyframes.filter(kf => kf.time <= time);
		
		if (activeKeyframes.length === 0) {
			return this._keyframes[0].value;
		}

		if (activeKeyframes.length === this._keyframes.length) {
			return this._keyframes[this._keyframes.length - 1].value;
		}

		// Get the keyframe before and after the time
		const beforeKeyframe = activeKeyframes[activeKeyframes.length - 1];
		const afterKeyframe = this._keyframes[activeKeyframes.length];

		// Linear interpolation
		const t = (time - beforeKeyframe.time) / (afterKeyframe.time - beforeKeyframe.time);
		return beforeKeyframe.value + (afterKeyframe.value - beforeKeyframe.value) * t;
	}

	public isActiveAtTime(time: number): boolean {
		return time >= this._startOffset && time <= this._startOffset + this._duration;
	}

	public getLocalTime(globalTime: number): number {
		return globalTime - this._startOffset;
	}

	public getGlobalTime(localTime: number): number {
		return localTime + this._startOffset;
	}

	public clone(overrides?: Partial<ClipMetadata>): IClip {
		const config: ClipConfig = {
			name: overrides?.name || this._metadata.name + ' (Copy)',
			startOffset: this._startOffset,
			rawData: this._rawData,
			optimizationParams: this._metadata.lastOptimizationParams,
			enabled: this._enabled,
			muted: this._muted,
			tags: overrides?.tags || this._metadata.tags
		};

		return new Clip(this._startOffset, this._duration, config);
	}

	public dispose(): void {
		this.clearKeyframes();
		this._optimizer.dispose();
		super.dispose();
	}

	/**
	 * Update the clip's raw data and regenerate keyframes
	 */
	public updateRawData(rawData: RawDataPoint[]): void {
		this._rawData = [...rawData];
		this._metadata.modifiedAt = Date.now();
		this._metadata.recordingParams.totalSamples = rawData.length;
		
		// Regenerate keyframes with last used parameters
		this.generateKeyframes(this._metadata.lastOptimizationParams);
	}

	/**
	 * Trim the clip to a new duration
	 */
	public trim(newDuration: number): void {
		if (newDuration <= 0 || newDuration > this._duration) {
			throw new Error('Invalid trim duration');
		}

		// Filter raw data to new duration
		this._rawData = this._rawData.filter(point => point.time <= newDuration);
		this._duration = newDuration;
		this._metadata.modifiedAt = Date.now();
		this._metadata.recordingParams.endTime = this._startOffset + newDuration;
		
		// Regenerate keyframes
		this.generateKeyframes(this._metadata.lastOptimizationParams);
	}

	/**
	 * Shift the clip to a new start offset
	 */
	public shift(newStartOffset: number): void {
		const oldStartOffset = this._startOffset;
		this._startOffset = newStartOffset;
		this._metadata.modifiedAt = Date.now();
		this._metadata.recordingParams.startTime = newStartOffset;
		this._metadata.recordingParams.endTime = newStartOffset + this._duration;
		
		// Update keyframe times
		const timeDelta = newStartOffset - oldStartOffset;
		this._keyframes = this._keyframes.map(kf => ({
			...kf,
			time: kf.time + timeDelta
		}));
	}
}