/**
 * AnimatableProperty implementation for managing clips and keyframes
 * @module AnimatableProperty
 * @memberof editor
 */

import { EventEmitter } from '../../../core/event-emitter.js';
import type { 
	IAnimatableProperty, 
	IClip, 
	ClipKeyframe, 
	AnimatablePropertyEventMap, 
	AnimatablePropertyConfig 
} from './types/ClipTypes.js';

/**
 * AnimatableProperty class that manages clips and keyframes for a single property
 */
export class AnimatableProperty extends EventEmitter<AnimatablePropertyEventMap> implements IAnimatableProperty {
	private _clips: IClip[] = [];
	private _keyframes: ClipKeyframe[] = [];
	private _value: number;

	public constructor(
		private _name: string,
		config: AnimatablePropertyConfig = {}
	) {
		super();
		
		this._value = config.initialValue ?? 0;
		
		// Add initial clips if provided
		if (config.clips) {
			for (const clip of config.clips) {
				this.addClip(clip);
			}
		}
	}

	public get name(): string {
		return this._name;
	}

	public get value(): number {
		return this._value;
	}

	public set value(newValue: number) {
		if (this._value !== newValue) {
			this._value = newValue;
			this.emitEvent('property:value-changed', { 
				property: this, 
				value: newValue, 
				time: Date.now() 
			});
		}
	}

	public get clips(): IClip[] {
		return [...this._clips];
	}

	public get keyframes(): ClipKeyframe[] {
		return [...this._keyframes];
	}

	public addClip(clip: IClip): void {
		if (this._clips.find(c => c.id === clip.id)) {
			console.warn(`Clip with id ${clip.id} already exists in property ${this._name}`);
			return;
		}

		// Add the clip
		this._clips.push(clip);
		
		// Sort clips by start offset
		this._clips.sort((a, b) => a.startOffset - b.startOffset);
		
		// Set up event listeners
		this.setupClipListeners(clip);
		
		// Rebuild keyframes
		this.rebuildKeyframes();
		
		// Emit event
		this.emitEvent('property:clip-added', { property: this, clip });
	}

	public removeClip(clipId: string): void {
		const clipIndex = this._clips.findIndex(c => c.id === clipId);
		if (clipIndex === -1) {
			console.warn(`Clip with id ${clipId} not found in property ${this._name}`);
			return;
		}

		const clip = this._clips[clipIndex];
		
		// Remove event listeners
		this.removeClipListeners(clip);
		
		// Remove the clip
		this._clips.splice(clipIndex, 1);
		
		// Rebuild keyframes
		this.rebuildKeyframes();
		
		// Emit event
		this.emitEvent('property:clip-removed', { property: this, clipId });
	}

	public getClip(clipId: string): IClip | undefined {
		return this._clips.find(c => c.id === clipId);
	}

	public getValueAtTime(time: number): number {
		// Get all active clips at the given time
		const activeClips = this.getActiveClipsAtTime(time);
		
		if (activeClips.length === 0) {
			return this._value; // Return base value if no clips are active
		}

		// For multiple clips, we need to blend them
		// For now, use the last clip's value (layer priority)
		// In the future, this could support different blending modes
		let finalValue = this._value;
		
		for (const clip of activeClips) {
			if (clip.enabled && !clip.muted) {
				finalValue = clip.getValueAtTime(time);
			}
		}
		
		return finalValue;
	}

	public getActiveClipsAtTime(time: number): IClip[] {
		return this._clips.filter(clip => clip.isActiveAtTime(time));
	}

	public regenerateAllKeyframes(): void {
		for (const clip of this._clips) {
			clip.generateKeyframes();
		}
		this.rebuildKeyframes();
	}

	public clearAllKeyframes(): void {
		for (const clip of this._clips) {
			clip.clearKeyframes();
		}
		this.rebuildKeyframes();
	}

	public dispose(): void {
		// Remove all clips
		for (const clip of this._clips) {
			this.removeClipListeners(clip);
			clip.dispose();
		}
		this._clips = [];
		this._keyframes = [];
		super.dispose();
	}

	/**
	 * Set up event listeners for a clip
	 */
	private setupClipListeners(clip: IClip): void {
		clip.on('clip:keyframes-generated', () => {
			this.rebuildKeyframes();
		});

		clip.on('clip:keyframes-cleared', () => {
			this.rebuildKeyframes();
		});

		clip.on('clip:enabled-changed', () => {
			this.rebuildKeyframes();
		});

		clip.on('clip:muted-changed', () => {
			this.rebuildKeyframes();
		});
	}

	/**
	 * Remove event listeners from a clip
	 */
	private removeClipListeners(clip: IClip): void {
		clip.off('clip:keyframes-generated');
		clip.off('clip:keyframes-cleared');
		clip.off('clip:enabled-changed');
		clip.off('clip:muted-changed');
	}

	/**
	 * Rebuild the keyframes array from all clips
	 */
	private rebuildKeyframes(): void {
		// Collect all keyframes from all clips
		const allKeyframes: ClipKeyframe[] = [];
		
		for (const clip of this._clips) {
			if (clip.enabled && !clip.muted) {
				allKeyframes.push(...clip.keyframes);
			}
		}
		
		// Sort by time
		allKeyframes.sort((a, b) => a.time - b.time);
		
		// Remove duplicates at the same time (keep the latest by clip order)
		const uniqueKeyframes: ClipKeyframe[] = [];
		for (const keyframe of allKeyframes) {
			const existing = uniqueKeyframes.find(k => Math.abs(k.time - keyframe.time) < 0.001);
			if (!existing) {
				uniqueKeyframes.push(keyframe);
			} else {
				// Replace if this clip comes after the existing one
				const existingClipIndex = this._clips.findIndex(c => c.id === existing.clipId);
				const currentClipIndex = this._clips.findIndex(c => c.id === keyframe.clipId);
				if (currentClipIndex > existingClipIndex) {
					const index = uniqueKeyframes.indexOf(existing);
					uniqueKeyframes[index] = keyframe;
				}
			}
		}
		
		this._keyframes = uniqueKeyframes;
		
		// Emit event
		this.emitEvent('property:keyframes-updated', { 
			property: this, 
			keyframes: this._keyframes 
		});
	}

	/**
	 * Get the keyframes for a specific clip
	 */
	public getClipKeyframes(clipId: string): ClipKeyframe[] {
		return this._keyframes.filter(kf => kf.clipId === clipId);
	}

	/**
	 * Remove keyframes for a specific clip
	 */
	public removeClipKeyframes(clipId: string): void {
		this._keyframes = this._keyframes.filter(kf => kf.clipId !== clipId);
		this.emitEvent('property:keyframes-updated', { 
			property: this, 
			keyframes: this._keyframes 
		});
	}

	/**
	 * Get clips that overlap with the given time range
	 */
	public getOverlappingClips(startTime: number, endTime: number): IClip[] {
		return this._clips.filter(clip => {
			const clipEnd = clip.startOffset + clip.duration;
			return !(clip.startOffset > endTime || clipEnd < startTime);
		});
	}

	/**
	 * Find the best insertion point for a new clip
	 */
	public findInsertionPoint(startOffset: number): number {
		for (let i = 0; i < this._clips.length; i++) {
			if (this._clips[i].startOffset > startOffset) {
				return i;
			}
		}
		return this._clips.length;
	}

	/**
	 * Check if a clip would overlap with existing clips
	 */
	public wouldOverlap(startOffset: number, duration: number, excludeClipId?: string): boolean {
		const endOffset = startOffset + duration;
		return this._clips.some(clip => {
			if (excludeClipId && clip.id === excludeClipId) {
				return false;
			}
			const clipEnd = clip.startOffset + clip.duration;
			return !(clip.startOffset >= endOffset || clipEnd <= startOffset);
		});
	}
}