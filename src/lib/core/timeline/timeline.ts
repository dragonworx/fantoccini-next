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
  /** The intrinsic duration of this timeline in seconds. */
  duration: number;
  /** The playback frame rate for this timeline's context. */
  framerate: number;
  /** A multiplier for playback speed relative to the parent. 1.0 is normal speed. */
  timeScale: number;
  /** The current local time of this timeline in seconds. */
  readonly currentTime: number;

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
  public duration: number = 10; // Default 10 seconds
  public framerate: number = 60; // Default 60 FPS
  public timeScale: number = 1; // Normal speed

  // Playback State
  public isPlaying: boolean = false;
  private _currentTime: number = 0;

  constructor(options: Partial<Pick<Timeline, 'startTime' | 'duration' | 'framerate' | 'timeScale'>> = {}) {
    super();
    Object.assign(this, options);
  }

  get currentTime(): number {
    return this._currentTime;
  }

  // --- Playback Control ---

  play(cascade: boolean = true): void {
    this.isPlaying = true;
    
    if (cascade) {
      this.children.forEach(child => child.play(true));
    }
  }

  pause(cascade: boolean = true): void {
    this.isPlaying = false;
    
    if (cascade) {
      this.children.forEach(child => child.pause(true));
    }
  }

  seek(time: number, cascade: boolean = true): void {
    this._currentTime = Math.max(0, time);
    
    // Update all children and objects immediately
    this.updateChildren();
    
    if (cascade) {
      this.children.forEach(child => {
        const childLocalTime = this.parentTimeToChildTime(this._currentTime, child);
        child.seek(childLocalTime, true);
      });
    }
  }

  // --- Hierarchy Management ---

  addChild(child: ITimeline): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    
    child.parent = this;
    this.children.push(child);
    this.subscribe(child);
  }

  removeChild(child: ITimeline): void {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parent = null;
      this.unsubscribe(child);
    }
  }

  addObject(object: ITimelineObject): void {
    this.objects.push(object);
    this.subscribe(object);
  }

  removeObject(object: ITimelineObject): void {
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
  update(context: any): void {
    if (this.parent === null) {
      // Root timeline - context should be delta time in seconds
      if (this.isPlaying && typeof context === 'number') {
        this._currentTime += context * this.timeScale;
      }
    } else {
      // Child timeline - context should be parent's current time
      if (typeof context === 'number') {
        this._currentTime = this.parentTimeToChildTime(context, this);
      }
    }

    this.updateChildren();
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

  localTimeToFrames(time: number): number {
    return time * this.framerate;
  }

  framesToLocalTime(frame: number): number {
    return frame / this.framerate;
  }

  // --- Debugging/Inspection ---

  /**
   * Gets the total number of child timelines (including nested children).
   */
  getTotalChildCount(): number {
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
  getTotalObjectCount(): number {
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
  getDepth(): number {
    let depth = 0;
    let current = this.parent;
    while (current) {
      depth++;
      current = current.parent;
    }
    return depth;
  }
}