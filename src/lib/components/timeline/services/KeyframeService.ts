/**
 * Keyframe service for timeline keyframe management
 * @module KeyframeService
 * @memberof editor
 */

import { EventEmitter } from '../../../../core/event-emitter.js';
import type { IKeyframe, ITimelineObject } from '../../../../core/timeline/index.js';
import type { Sprite } from '../../../../core/object/sprite.js';
import type { TimelineComponentEventMap, InterpolationType } from '../types/TimelineTypes.js';
import { generateId } from '../utils/TimelineUtils.js';

/**
 * Service for managing timeline keyframes
 */
export class KeyframeService extends EventEmitter<TimelineComponentEventMap> {
	private keyframes: Map<string, Map<string, IKeyframe<any>>> = new Map(); // trackId -> keyframeId -> keyframe
	private trackObjects: Map<string, ITimelineObject> = new Map(); // trackId -> timeline object
	private selectedKeyframes: Set<string> = new Set(); // Set of keyframeId

	constructor() {
		super();
	}

	/**
   * Add a keyframe to a track
   */
	public addKeyframe(trackId: string, time: number, value: any, interpolation: InterpolationType = 'Linear'): IKeyframe<any> {
		const keyframeId = generateId('keyframe');
		const keyframe: IKeyframe<any> = {
			time,
			value,
			interpolation,
			bezierControlPoints: interpolation === 'Bezier' ? {
				cp1: { time: 0.25, value: 0.1 },
				cp2: { time: 0.25, value: 1 }
			} : undefined
		};

		// Get or create track map
		if (!this.keyframes.has(trackId)) {
			this.keyframes.set(trackId, new Map());
		}
    
		const trackKeyframes = this.keyframes.get(trackId)!;
		trackKeyframes.set(keyframeId, keyframe);

		// Update the timeline object if it exists
		const timelineObject = this.trackObjects.get(trackId);
		if (timelineObject) {
			this.updateTimelineObject(trackId);
		}

		this.emitEvent('keyframe:add', {
			trackId,
			keyframeId,
			time,
			value
		});

		return keyframe;
	}

	/**
   * Remove a keyframe from a track
   */
	public removeKeyframe(trackId: string, keyframeId: string): void {
		const trackKeyframes = this.keyframes.get(trackId);
		if (!trackKeyframes || !trackKeyframes.has(keyframeId)) {
			return;
		}

		trackKeyframes.delete(keyframeId);
		this.selectedKeyframes.delete(keyframeId);

		// Update the timeline object if it exists
		const timelineObject = this.trackObjects.get(trackId);
		if (timelineObject) {
			this.updateTimelineObject(trackId);
		}

		this.emitEvent('keyframe:remove', {
			trackId,
			keyframeId
		});
	}

	/**
   * Move a keyframe to a new time
   */
	public moveKeyframe(trackId: string, keyframeId: string, newTime: number): void {
		const trackKeyframes = this.keyframes.get(trackId);
		if (!trackKeyframes || !trackKeyframes.has(keyframeId)) {
			return;
		}

		const keyframe = trackKeyframes.get(keyframeId)!;
		const oldTime = keyframe.time;
		keyframe.time = Math.max(0, newTime);

		// Update the timeline object if it exists
		const timelineObject = this.trackObjects.get(trackId);
		if (timelineObject) {
			this.updateTimelineObject(trackId);
		}

		this.emitEvent('keyframe:move', {
			trackId,
			keyframeId,
			oldTime,
			newTime: keyframe.time
		});
	}

	/**
   * Edit a keyframe value
   */
	public editKeyframe(trackId: string, keyframeId: string, newValue: any): void {
		const trackKeyframes = this.keyframes.get(trackId);
		if (!trackKeyframes || !trackKeyframes.has(keyframeId)) {
			return;
		}

		const keyframe = trackKeyframes.get(keyframeId)!;
		const oldValue = keyframe.value;
		keyframe.value = newValue;

		// Update the timeline object if it exists
		const timelineObject = this.trackObjects.get(trackId);
		if (timelineObject) {
			this.updateTimelineObject(trackId);
		}

		this.emitEvent('keyframe:edit', {
			trackId,
			keyframeId,
			oldValue,
			newValue
		});
	}

	/**
   * Set keyframe interpolation type
   */
	public setKeyframeInterpolation(trackId: string, keyframeId: string, interpolation: InterpolationType, controlPoints?: [number, number, number, number]): void {
		const trackKeyframes = this.keyframes.get(trackId);
		if (!trackKeyframes || !trackKeyframes.has(keyframeId)) {
			return;
		}

		const keyframe = trackKeyframes.get(keyframeId)!;
		keyframe.interpolation = interpolation;
    
		// Handle Bezier control points properly
		if (interpolation === 'Bezier' && controlPoints) {
			keyframe.bezierControlPoints = {
				cp1: { time: controlPoints[0], value: controlPoints[1] },
				cp2: { time: controlPoints[2], value: controlPoints[3] }
			};
		} else if (interpolation === 'Bezier' && !controlPoints) {
			keyframe.bezierControlPoints = {
				cp1: { time: 0.25, value: 0.1 },
				cp2: { time: 0.25, value: 1 }
			};
		} else {
			keyframe.bezierControlPoints = undefined;
		}

		// Update the timeline object if it exists
		const timelineObject = this.trackObjects.get(trackId);
		if (timelineObject) {
			this.updateTimelineObject(trackId);
		}
	}

	/**
   * Get a specific keyframe
   */
	public getKeyframe(trackId: string, keyframeId: string): IKeyframe<any> | null {
		const trackKeyframes = this.keyframes.get(trackId);
		if (!trackKeyframes || !trackKeyframes.has(keyframeId)) {
			return null;
		}
		return trackKeyframes.get(keyframeId)!;
	}

	/**
   * Get all keyframes for a track
   */
	public getKeyframes(trackId: string): IKeyframe<any>[] {
		const trackKeyframes = this.keyframes.get(trackId);
		if (!trackKeyframes) {
			return [];
		}
    
		// Return keyframes sorted by time
		return Array.from(trackKeyframes.values()).sort((a, b) => a.time - b.time);
	}

	/**
   * Get all keyframes for a track with their IDs
   */
	public getKeyframesWithIds(trackId: string): Array<{ id: string; keyframe: IKeyframe<any> }> {
		const trackKeyframes = this.keyframes.get(trackId);
		if (!trackKeyframes) {
			return [];
		}
    
		const result: Array<{ id: string; keyframe: IKeyframe<any> }> = [];
		for (const [id, keyframe] of trackKeyframes) {
			result.push({ id, keyframe });
		}
    
		// Sort by time
		result.sort((a, b) => a.keyframe.time - b.keyframe.time);
		return result;
	}

	/**
   * Register a timeline object for a track
   */
	public registerTrack(trackId: string, timelineObject: ITimelineObject): void {
		this.trackObjects.set(trackId, timelineObject);
		this.updateTimelineObject(trackId);
	}

	/**
   * Unregister a track
   */
	public unregisterTrack(trackId: string): void {
		this.trackObjects.delete(trackId);
		this.keyframes.delete(trackId);
    
		// Remove any selected keyframes from this track
		const trackKeyframes = this.keyframes.get(trackId);
		if (trackKeyframes) {
			for (const keyframeId of trackKeyframes.keys()) {
				this.selectedKeyframes.delete(keyframeId);
			}
		}
	}

	/**
   * Select keyframes
   */
	public selectKeyframes(trackId: string, keyframeIds: string[], multiSelect: boolean = false): void {
		if (!multiSelect) {
			this.selectedKeyframes.clear();
		}

		for (const keyframeId of keyframeIds) {
			this.selectedKeyframes.add(keyframeId);
		}

		this.emitEvent('keyframe:select', {
			trackId,
			keyframeIds,
			multiSelect
		});
	}

	/**
   * Deselect keyframes
   */
	public deselectKeyframes(trackId: string, keyframeIds: string[]): void {
		for (const keyframeId of keyframeIds) {
			this.selectedKeyframes.delete(keyframeId);
		}

		this.emitEvent('keyframe:deselect', {
			trackId,
			keyframeIds
		});
	}

	/**
   * Clear all selections
   */
	public clearSelection(): void {
		this.selectedKeyframes.clear();
	}

	/**
   * Get selected keyframes
   */
	public getSelectedKeyframes(): Set<string> {
		return new Set(this.selectedKeyframes);
	}

	/**
   * Check if a keyframe is selected
   */
	public isKeyframeSelected(keyframeId: string): boolean {
		return this.selectedKeyframes.has(keyframeId);
	}

	/**
   * Get keyframes at a specific time
   */
	public getKeyframesAtTime(trackId: string, time: number, tolerance: number = 0.001): Array<{ id: string; keyframe: IKeyframe<any> }> {
		const trackKeyframes = this.keyframes.get(trackId);
		if (!trackKeyframes) {
			return [];
		}

		const result: Array<{ id: string; keyframe: IKeyframe<any> }> = [];
		for (const [id, keyframe] of trackKeyframes) {
			if (Math.abs(keyframe.time - time) <= tolerance) {
				result.push({ id, keyframe });
			}
		}

		return result;
	}

	/**
   * Get keyframes in a time range
   */
	public getKeyframesInRange(trackId: string, startTime: number, endTime: number): Array<{ id: string; keyframe: IKeyframe<any> }> {
		const trackKeyframes = this.keyframes.get(trackId);
		if (!trackKeyframes) {
			return [];
		}

		const result: Array<{ id: string; keyframe: IKeyframe<any> }> = [];
		for (const [id, keyframe] of trackKeyframes) {
			if (keyframe.time >= startTime && keyframe.time <= endTime) {
				result.push({ id, keyframe });
			}
		}

		// Sort by time
		result.sort((a, b) => a.keyframe.time - b.keyframe.time);
		return result;
	}

	/**
   * Copy keyframes to clipboard (returns serialized data)
   */
	public copyKeyframes(trackId: string, keyframeIds: string[]): string {
		const trackKeyframes = this.keyframes.get(trackId);
		if (!trackKeyframes) {
			return JSON.stringify([]);
		}

		const copied: Array<{ id: string; keyframe: IKeyframe<any> }> = [];
		for (const keyframeId of keyframeIds) {
			const keyframe = trackKeyframes.get(keyframeId);
			if (keyframe) {
				copied.push({ id: keyframeId, keyframe });
			}
		}

		return JSON.stringify(copied);
	}

	/**
   * Paste keyframes from clipboard data
   */
	public pasteKeyframes(trackId: string, time: number, clipboardData: string): void {
		try {
			const data = JSON.parse(clipboardData) as Array<{ id: string; keyframe: IKeyframe<any> }>;
      
			if (data.length === 0) {
				return;
			}

			// Find the earliest time in the copied keyframes
			const earliestTime = Math.min(...data.map(item => item.keyframe.time));
			const timeOffset = time - earliestTime;

			// Add keyframes with time offset
			for (const item of data) {
				const newTime = item.keyframe.time + timeOffset;
				this.addKeyframe(trackId, newTime, item.keyframe.value, item.keyframe.interpolation);
			}
		} catch (error) {
			console.error('Failed to paste keyframes:', error);
		}
	}

	/**
   * Update the timeline object with current keyframes
   */
	private updateTimelineObject(trackId: string): void {
		const timelineObject = this.trackObjects.get(trackId);
		const trackKeyframes = this.keyframes.get(trackId);
    
		if (!timelineObject || !trackKeyframes) {
			return;
		}

		// This would need to be implemented based on the specific timeline object structure
		// For now, we'll assume the timeline object has a method to update its keyframes
		// This is a placeholder that would need to be adapted to the actual implementation
		console.log(`Updating timeline object for track ${trackId} with ${trackKeyframes.size} keyframes`);
	}

	/**
   * Dispose of the service
   */
	public dispose(): void {
		this.keyframes.clear();
		this.trackObjects.clear();
		this.selectedKeyframes.clear();
		super.dispose();
	}
}