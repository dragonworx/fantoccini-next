/**
 * AnimatableObject implementation for managing animatable properties
 * @module AnimatableObject
 * @memberof editor
 */

import { EventEmitter } from '../../../core/event-emitter.js';
import { AnimatableProperty } from './AnimatableProperty.js';
import { Clip } from './Clip.js';
import type { 
	IAnimatableProperty, 
	IClip, 
	RawDataPoint, 
	ClipConfig 
} from './types/ClipTypes.js';
import type { KeyframeOptimizationParams } from '../keyframe-optimizer/types/KeyframeOptimizerTypes.js';

/**
 * Events emitted by animatable objects
 */
export interface AnimatableObjectEventMap {
	[key: string]: unknown;
	'object:property-added': { object: AnimatableObject; property: IAnimatableProperty };
	'object:property-removed': { object: AnimatableObject; propertyName: string };
	'object:clip-added': { object: AnimatableObject; propertyName: string; clip: IClip };
	'object:clip-removed': { object: AnimatableObject; propertyName: string; clipId: string };
	'object:recording-started': { object: AnimatableObject; properties: string[] };
	'object:recording-stopped': { object: AnimatableObject; clips: IClip[] };
}

/**
 * Configuration for creating an animatable object
 */
export interface AnimatableObjectConfig {
	/** Initial property values */
	initialValues?: Record<string, number>;
	/** Properties to create */
	properties?: string[];
}

/**
 * Manages animatable properties and their clips
 */
export class AnimatableObject extends EventEmitter<AnimatableObjectEventMap> {
	private _properties: Map<string, IAnimatableProperty> = new Map();
	private _isRecording = false;
	private _recordingStartTime = 0;
	private _recordingProperties: string[] = [];
	private _recordingData: Map<string, RawDataPoint[]> = new Map();

	public constructor(
		private _name: string,
		config: AnimatableObjectConfig = {}
	) {
		super();
		
		// Create initial properties
		const propertyNames = config.properties || ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'alpha'];
		for (const propertyName of propertyNames) {
			const initialValue = config.initialValues?.[propertyName] ?? 0;
			this.addProperty(propertyName, initialValue);
		}
	}

	public get name(): string {
		return this._name;
	}

	public get properties(): IAnimatableProperty[] {
		return Array.from(this._properties.values());
	}

	public get isRecording(): boolean {
		return this._isRecording;
	}

	/**
	 * Add a new animatable property
	 */
	public addProperty(name: string, initialValue: number = 0): IAnimatableProperty {
		if (this._properties.has(name)) {
			throw new Error(`Property ${name} already exists`);
		}

		const property = new AnimatableProperty(name, { initialValue });
		this._properties.set(name, property);
		
		// Set up event forwarding
		property.on('property:clip-added', (event) => {
			this.emitEvent('object:clip-added', { 
				object: this, 
				propertyName: name, 
				clip: event.clip 
			});
		});
		
		property.on('property:clip-removed', (event) => {
			this.emitEvent('object:clip-removed', { 
				object: this, 
				propertyName: name, 
				clipId: event.clipId 
			});
		});
		
		this.emitEvent('object:property-added', { object: this, property });
		return property;
	}

	/**
	 * Remove an animatable property
	 */
	public removeProperty(name: string): void {
		const property = this._properties.get(name);
		if (!property) {
			throw new Error(`Property ${name} does not exist`);
		}

		property.dispose();
		this._properties.delete(name);
		
		this.emitEvent('object:property-removed', { object: this, propertyName: name });
	}

	/**
	 * Get a property by name
	 */
	public getProperty(name: string): IAnimatableProperty | undefined {
		return this._properties.get(name);
	}

	/**
	 * Get all property names
	 */
	public getPropertyNames(): string[] {
		return Array.from(this._properties.keys());
	}

	/**
	 * Get the value of a property at a specific time
	 */
	public getPropertyValueAtTime(propertyName: string, time: number): number {
		const property = this._properties.get(propertyName);
		if (!property) {
			throw new Error(`Property ${propertyName} does not exist`);
		}
		return property.getValueAtTime(time);
	}

	/**
	 * Set the current value of a property
	 */
	public setPropertyValue(propertyName: string, value: number): void {
		const property = this._properties.get(propertyName);
		if (!property) {
			throw new Error(`Property ${propertyName} does not exist`);
		}
		property.value = value;
		
		// If recording, capture the data point
		if (this._isRecording && this._recordingProperties.includes(propertyName)) {
			this.captureDataPoint(propertyName, value);
		}
	}

	/**
	 * Start recording for specified properties
	 */
	public startRecording(properties: string[]): void {
		if (this._isRecording) {
			throw new Error('Already recording');
		}

		// Validate properties exist
		for (const prop of properties) {
			if (!this._properties.has(prop)) {
				throw new Error(`Property ${prop} does not exist`);
			}
		}

		this._isRecording = true;
		this._recordingStartTime = Date.now();
		this._recordingProperties = [...properties];
		this._recordingData.clear();
		
		// Initialize recording data
		for (const prop of properties) {
			this._recordingData.set(prop, []);
		}
		
		this.emitEvent('object:recording-started', { 
			object: this, 
			properties: this._recordingProperties 
		});
	}

	/**
	 * Stop recording and create clips
	 */
	public stopRecording(
		clipName: string = 'Recording',
		optimizationParams?: Partial<KeyframeOptimizationParams>
	): IClip[] {
		if (!this._isRecording) {
			throw new Error('Not currently recording');
		}

		const recordingDuration = (Date.now() - this._recordingStartTime) / 1000;
		const clips: IClip[] = [];
		
		// Create clips for each property that has data
		for (const [propertyName, rawData] of this._recordingData) {
			if (rawData.length === 0) {
				continue;
			}

			const property = this._properties.get(propertyName);
			if (!property) {
				continue;
			}

			// Create clip configuration
			const clipConfig: ClipConfig = {
				name: `${clipName} - ${propertyName}`,
				startOffset: 0, // TODO: This should be relative to timeline position
				rawData: rawData,
				optimizationParams,
				enabled: true,
				muted: false,
				tags: ['recording', propertyName]
			};

			// Create and add clip
			const clip = new Clip(0, recordingDuration, clipConfig);
			property.addClip(clip);
			clips.push(clip);
		}

		// Reset recording state
		this._isRecording = false;
		this._recordingProperties = [];
		this._recordingData.clear();
		
		this.emitEvent('object:recording-stopped', { object: this, clips });
		return clips;
	}

	/**
	 * Capture a data point during recording
	 */
	private captureDataPoint(propertyName: string, value: number): void {
		if (!this._isRecording) {
			return;
		}

		const rawData = this._recordingData.get(propertyName);
		if (!rawData) {
			return;
		}

		const time = (Date.now() - this._recordingStartTime) / 1000;
		const dataPoint: RawDataPoint = {
			time,
			value,
			timestamp: Date.now()
		};

		rawData.push(dataPoint);
	}

	/**
	 * Create a clip from raw data
	 */
	public createClip(
		propertyName: string,
		startOffset: number,
		rawData: RawDataPoint[],
		config: Partial<ClipConfig> = {}
	): IClip {
		const property = this._properties.get(propertyName);
		if (!property) {
			throw new Error(`Property ${propertyName} does not exist`);
		}

		const duration = rawData.length > 0 
			? Math.max(...rawData.map(d => d.time)) - Math.min(...rawData.map(d => d.time))
			: 0;

		const clipConfig: ClipConfig = {
			name: config.name || `${this._name} - ${propertyName}`,
			startOffset,
			rawData,
			optimizationParams: config.optimizationParams,
			enabled: config.enabled ?? true,
			muted: config.muted ?? false,
			tags: config.tags || [propertyName]
		};

		const clip = new Clip(startOffset, duration, clipConfig);
		property.addClip(clip);
		return clip;
	}

	/**
	 * Remove a clip from a property
	 */
	public removeClip(propertyName: string, clipId: string): void {
		const property = this._properties.get(propertyName);
		if (!property) {
			throw new Error(`Property ${propertyName} does not exist`);
		}

		property.removeClip(clipId);
	}

	/**
	 * Get all clips for a property
	 */
	public getClips(propertyName: string): IClip[] {
		const property = this._properties.get(propertyName);
		if (!property) {
			throw new Error(`Property ${propertyName} does not exist`);
		}

		return property.clips;
	}

	/**
	 * Get all clips across all properties
	 */
	public getAllClips(): IClip[] {
		const clips: IClip[] = [];
		for (const property of this._properties.values()) {
			clips.push(...property.clips);
		}
		return clips;
	}

	/**
	 * Dispose of the object
	 */
	public dispose(): void {
		for (const property of this._properties.values()) {
			property.dispose();
		}
		this._properties.clear();
		super.dispose();
	}
}