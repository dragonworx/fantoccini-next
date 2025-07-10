/**
 * Timeline implementation for the timeline animation engine.
 * Core entity for managing time, playback, and hierarchy.
 */

import { IObserver, IObservable, Observable } from './observer.js';
import { ITimelineObject } from './timeline-object.js';

/**
 * A self-nesting temporal container that manages playback and time conversion.
 * It acts as both an Observer (of its parent) and an Observable (to its children).
 */
export interface ITimeline extends IObserver, IObservable {
  // --- Hierarchy ---
  parent: ITimeline | null;
  children: ITimeline[];
  objects: ITimelineObject[];

  // --- Timing Properties ---
  /** The start time of this timeline, in seconds, relative to its parent's local time. */
  startTime: number;
  /** The intrinsic duration of this timeline in seconds. If null, timeline has infinite duration. */
  duration: number | null;
  /** The playback frame rate for this timeline's context. */
  framerate: number;
  /** A multiplier for playback speed relative to the parent. 1.0 is normal speed. */
  timeScale: number;
  /** The current local time of this timeline in seconds. */
  readonly currentTime: number;

  // --- Loop Properties ---
  /** Whether this timeline should loop when it reaches its duration. */
  loop: boolean;
  /** Number of times to repeat the loop. 0 means infinite loops, >1 means finite repeats. */
  repeatCount: number;
  /** The current loop iteration (read-only). */
  readonly currentLoop: number;

  // --- Playback State & Control ---
  isPlaying: boolean;
  play(cascade?: boolean): void;
  pause(cascade?: boolean): void;
  seek(time: number, cascade?: boolean): void;

  // --- Hierarchy Management ---
  addChild(child: ITimeline): void;
  removeChild(child: ITimeline): void;
  addObject(object: ITimelineObject): void;
  removeObject(object: ITimelineObject): void;

  // --- Utility Methods ---
  /** Converts a local time in seconds to a local frame number based on the timeline's framerate. */
  localTimeToFrames(time: number): number;
  /** Converts a local frame number to a local time in seconds based on the timeline's framerate. */
  framesToLocalTime(frame: number): number;
}

/**
 * Implementation of ITimeline that manages hierarchical time and playback.
 */
export class Timeline extends Observable implements ITimeline {
	// Hierarchy
	public parent: ITimeline | null = null;
	public children: ITimeline[] = [];
	public objects: ITimelineObject[] = [];

	// Timing Properties
	public startTime: number = 0;
	public duration: number | null = null; // Default null (infinite duration)
	public framerate: number = 60; // Default 60 FPS
	public timeScale: number = 1; // Normal speed

	// Loop Properties
	public loop: boolean = false;
	public repeatCount: number = 0; // 0 = infinite, >0 = finite repeats
	private _currentLoop: number = 0;

	// Playback State
	public isPlaying: boolean = false;
	private _currentTime: number = 0;
	private _rawTime: number = 0; // Unprocessed time for loop calculations

	public constructor(options: Partial<Pick<Timeline, 'startTime' | 'duration' | 'framerate' | 'timeScale' | 'loop' | 'repeatCount'>> = {}) {
		super();
		Object.assign(this, options);
	}

	public get currentTime(): number {
		return this._currentTime;
	}

	public get currentLoop(): number {
		return this._currentLoop;
	}

	// --- Playback Control ---

	public play(cascade: boolean = true): void {
		this.isPlaying = true;
    
		if (cascade) {
			this.children.forEach(child => child.play(true));
		}
	}

	public pause(cascade: boolean = true): void {
		this.isPlaying = false;
    
		if (cascade) {
			this.children.forEach(child => child.pause(true));
		}
	}

	public seek(time: number, cascade: boolean = true): void {
		this._rawTime = Math.max(0, time);
		this.updateTimeFromRaw();
    
		// Update timeline objects (not children - they'll be updated via cascade)
		this.objects.forEach(object => {
			object.update(this._currentTime);
		});
    
		if (cascade) {
			this.children.forEach(child => {
				const childLocalTime = this.parentTimeToChildTime(this._currentTime, child);
				child.seek(childLocalTime, true);
			});
		}
	}

	// --- Hierarchy Management ---

	public addChild(child: ITimeline): void {
		if (child.parent) {
			child.parent.removeChild(child);
		}
    
		child.parent = this;
		this.children.push(child);
		this.subscribe(child);
	}

	public removeChild(child: ITimeline): void {
		const index = this.children.indexOf(child);
		if (index >= 0) {
			this.children.splice(index, 1);
			child.parent = null;
			this.unsubscribe(child);
		}
	}

	public addObject(object: ITimelineObject): void {
		this.objects.push(object);
		this.subscribe(object);
	}

	public removeObject(object: ITimelineObject): void {
		const index = this.objects.indexOf(object);
		if (index >= 0) {
			this.objects.splice(index, 1);
			this.unsubscribe(object);
		}
	}

	// --- Time Updates ---

	/**
   * Updates the timeline with a delta time (for root timelines)
   * or receives update from parent timeline.
   */
	public update(context: number | unknown): void {
		if (this.parent === null) {
			// Root timeline - context should be delta time in seconds
			if (this.isPlaying && typeof context === 'number') {
				this._rawTime += context * this.timeScale;
				this.updateTimeFromRaw();
			}
		} else {
			// Child timeline - context should be parent's current time
			if (typeof context === 'number') {
				this._rawTime = this.parentTimeToChildTime(context, this);
				this.updateTimeFromRaw();
			}
		}

		this.updateChildren();
	}

	/**
   * Processes raw time according to duration and looping rules.
   * Maps the raw time to the correct timeline local time.
   */
	private updateTimeFromRaw(): void {
		if (this.duration === null) {
			// Infinite duration - raw time becomes current time
			this._currentTime = Math.max(0, this._rawTime);
			this._currentLoop = 0;
			return;
		}

		const duration = this.duration;
		const rawTime = Math.max(0, this._rawTime);

		if (!this.loop) {
			// No looping - clamp to duration
			this._currentTime = Math.min(rawTime, duration);
			this._currentLoop = 0;
      
			// Stop playback if we've reached the end
			if (rawTime >= duration) {
				this.isPlaying = false;
			}
			return;
		}

		// Looping enabled
		if (rawTime < duration) {
			// Within first iteration
			this._currentTime = rawTime;
			this._currentLoop = 0;
			return;
		}

		// Calculate loop iteration and local time
		const totalLoops = Math.floor(rawTime / duration);
		const localTime = rawTime % duration;

		if (this.repeatCount > 0 && totalLoops >= this.repeatCount) {
			// Finite loops - stop at the end of final iteration
			this._currentTime = duration;
			this._currentLoop = this.repeatCount - 1;
			this.isPlaying = false;
		} else {
			// Continue looping (infinite or within repeat count)
			this._currentTime = localTime;
			this._currentLoop = totalLoops;
		}
	}

	/**
   * Updates all child timelines and objects with the current time.
   */
	private updateChildren(): void {
		// Update child timelines
		this.children.forEach(child => {
			if (child instanceof Timeline) {
				child.update(this._currentTime);
			}
		});

		// Update timeline objects
		this.objects.forEach(object => {
			object.update(this._currentTime);
		});

		// Notify observers
		this.notify(this._currentTime);
	}

	/**
   * Converts parent time to child's local time.
   */
	private parentTimeToChildTime(parentTime: number, child: ITimeline): number {
		return Math.max(0, (parentTime - child.startTime) * child.timeScale);
	}

	// --- Utility Methods ---

	public localTimeToFrames(time: number): number {
		return time * this.framerate;
	}

	public framesToLocalTime(frame: number): number {
		return frame / this.framerate;
	}

	// --- Loop Control Methods ---

	/**
   * Resets the timeline to the beginning and clears loop state.
   */
	public reset(): void {
		this._rawTime = 0;
		this._currentTime = 0;
		this._currentLoop = 0;
		this.updateChildren();
	}

	/**
   * Gets the total duration including all loops.
   * Returns null if the timeline has infinite duration or infinite loops.
   */
	public getTotalDuration(): number | null {
		if (this.duration === null || (this.loop && this.repeatCount === 0)) {
			return null; // Infinite duration
		}
    
		if (!this.loop) {
			return this.duration;
		}
    
		return this.duration * this.repeatCount;
	}

	/**
   * Gets the progress through the entire timeline including loops (0-1).
   * Returns null if the timeline has infinite duration.
   */
	public getTotalProgress(): number | null {
		const totalDuration = this.getTotalDuration();
		if (totalDuration === null) {
			return null;
		}
    
		return Math.min(1, this._rawTime / totalDuration);
	}

	/**
   * Gets the progress through the current loop iteration (0-1).
   * Returns null if the timeline has no duration.
   */
	public getCurrentLoopProgress(): number | null {
		if (this.duration === null) {
			return null;
		}
    
		return Math.min(1, this._currentTime / this.duration);
	}

	/**
   * Checks if the timeline has completed all its loops.
   */
	public isComplete(): boolean {
		if (this.duration === null || (this.loop && this.repeatCount === 0)) {
			return false; // Infinite timelines never complete
		}
    
		if (!this.loop) {
			return this._rawTime >= this.duration;
		}
    
		return this.repeatCount > 0 && this._currentLoop >= this.repeatCount - 1 && this._currentTime >= this.duration;
	}

	/**
   * Sets up the timeline for infinite looping.
   */
	public setInfiniteLoop(): void {
		if (this.duration === null) {
			throw new Error('Cannot loop a timeline without a duration');
		}
		this.loop = true;
		this.repeatCount = 0;
	}

	/**
   * Sets up the timeline for finite looping.
   */
	public setFiniteLoop(repeatCount: number): void {
		if (this.duration === null) {
			throw new Error('Cannot loop a timeline without a duration');
		}
		if (repeatCount < 1) {
			throw new Error('Repeat count must be at least 1');
		}
		this.loop = true;
		this.repeatCount = repeatCount;
	}

	/**
   * Disables looping for the timeline.
   */
	public disableLoop(): void {
		this.loop = false;
		this.repeatCount = 0;
	}

	// --- Debugging/Inspection ---

	/**
   * Gets the total number of child timelines (including nested children).
   */
	public getTotalChildCount(): number {
		let count = this.children.length;
		this.children.forEach(child => {
			if (child instanceof Timeline) {
				count += child.getTotalChildCount();
			}
		});
		return count;
	}

	/**
   * Gets the total number of timeline objects (including in nested children).
   */
	public getTotalObjectCount(): number {
		let count = this.objects.length;
		this.children.forEach(child => {
			if (child instanceof Timeline) {
				count += child.getTotalObjectCount();
			}
		});
		return count;
	}

	/**
   * Gets the depth of this timeline in the hierarchy (root = 0).
   */
	public getDepth(): number {
		let depth = 0;
		let current = this.parent;
		while (current) {
			depth++;
			current = current.parent;
		}
		return depth;
	}
}