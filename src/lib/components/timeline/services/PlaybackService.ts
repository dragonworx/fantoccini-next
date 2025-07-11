/**
 * Playback service for timeline control
 * @module PlaybackService
 * @memberof editor
 */

import { EventEmitter } from '../../../../core/event-emitter.js';
import { Timeline } from '../../../../core/timeline/index.js';
import type { Metronome } from '../../../../core/metronome/index.js';
import type { TimelineComponentEventMap } from '../types/TimelineTypes.js';

/**
 * Service for managing timeline playback
 */
export class PlaybackService extends EventEmitter<TimelineComponentEventMap> {
	private timeline: Timeline;
	private metronome: Metronome;
	private _currentTime: number = 0;
	private _duration: number = 10; // Default 10 seconds
	private _isPlaying: boolean = false;
	private _speed: number = 1;
	private _loop: boolean = false;
	private _framerate: number = 60;
	private lastUpdateTime: number = 0;
	private animationFrameId: number | null = null;

	constructor(timeline: Timeline, metronome: Metronome) {
		super();
		this.timeline = timeline;
		this.metronome = metronome;
    
		// Sync with timeline properties
		this._duration = timeline.duration ?? 10;
		this._framerate = timeline.framerate;
		this._loop = timeline.loop;
    
		// Listen to timeline events
		this.timeline.on('play', () => {
			this._isPlaying = true;
			this.emitEvent('playback:play', { 
				currentTime: this._currentTime, 
				speed: this._speed 
			});
		});
    
		this.timeline.on('pause', () => {
			this._isPlaying = false;
			this.emitEvent('playback:pause', { currentTime: this._currentTime });
		});
    
		this.timeline.on('timeUpdate', (data) => {
			this._currentTime = data.currentTime;
			this.emitEvent('playback:tick', { 
				currentTime: this._currentTime, 
				deltaTime: data.deltaTime 
			});
		});
    
		this.timeline.on('complete', () => {
			this._isPlaying = false;
			this.emitEvent('playback:complete', { duration: this._duration });
		});
	}

	/**
   * Start playback
   */
	public play(): void {
		if (this._isPlaying) {
			return;
		}
    
		this._isPlaying = true;
		this.lastUpdateTime = performance.now();
		this.timeline.play();
		this.startUpdateLoop();
    
		this.emitEvent('playback:play', { 
			currentTime: this._currentTime, 
			speed: this._speed 
		});
	}

	/**
   * Pause playback
   */
	public pause(): void {
		if (!this._isPlaying) {
			return;
		}
    
		this._isPlaying = false;
		this.timeline.pause();
		this.stopUpdateLoop();
    
		this.emitEvent('playback:pause', { currentTime: this._currentTime });
	}

	/**
   * Stop playback and reset to beginning
   */
	public stop(): void {
		const wasPlaying = this._isPlaying;
		this._isPlaying = false;
		this.timeline.pause();
		this.stopUpdateLoop();
    
		this.seek(0);
    
		this.emitEvent('playback:stop', { currentTime: this._currentTime });
	}

	/**
   * Seek to specific time
   */
	public seek(time: number): void {
		const clampedTime = Math.max(0, Math.min(time, this._duration));
		const previousTime = this._currentTime;
    
		this._currentTime = clampedTime;
		this.timeline.seek(clampedTime);
    
		if (clampedTime !== previousTime) {
			this.emitEvent('playback:seek', { 
				time: clampedTime, 
				frame: Math.round(clampedTime * this._framerate) 
			});
		}
	}

	/**
   * Set playback speed
   */
	public setSpeed(speed: number): void {
		this._speed = Math.max(0.1, Math.min(speed, 4)); // Clamp between 0.1x and 4x
		this.timeline.timeScale = this._speed;
	}

	/**
   * Set loop mode
   */
	public setLoop(loop: boolean): void {
		this._loop = loop;
		this.timeline.loop = loop;
	}

	/**
   * Set duration
   */
	public setDuration(duration: number): void {
		this._duration = Math.max(0.1, duration);
		this.timeline.duration = this._duration;
	}

	/**
   * Set framerate
   */
	public setFramerate(framerate: number): void {
		this._framerate = Math.max(1, Math.min(framerate, 120)); // Clamp between 1 and 120 fps
		this.timeline.framerate = this._framerate;
	}

	/**
   * Get current time
   */
	public getCurrentTime(): number {
		return this._currentTime;
	}

	/**
   * Get duration
   */
	public getDuration(): number {
		return this._duration;
	}

	/**
   * Get current frame
   */
	public getCurrentFrame(): number {
		return Math.round(this._currentTime * this._framerate);
	}

	/**
   * Get total frames
   */
	public getTotalFrames(): number {
		return Math.round(this._duration * this._framerate);
	}

	/**
   * Check if playing
   */
	public isPlaying(): boolean {
		return this._isPlaying;
	}

	/**
   * Get playback speed
   */
	public getSpeed(): number {
		return this._speed;
	}

	/**
   * Get loop mode
   */
	public getLoop(): boolean {
		return this._loop;
	}

	/**
   * Get framerate
   */
	public getFramerate(): number {
		return this._framerate;
	}

	/**
   * Get playback progress (0-1)
   */
	public getProgress(): number {
		return this._duration > 0 ? this._currentTime / this._duration : 0;
	}

	/**
   * Skip to next frame
   */
	public nextFrame(): void {
		const frameTime = 1 / this._framerate;
		this.seek(this._currentTime + frameTime);
	}

	/**
   * Skip to previous frame
   */
	public previousFrame(): void {
		const frameTime = 1 / this._framerate;
		this.seek(this._currentTime - frameTime);
	}

	/**
   * Toggle play/pause
   */
	public togglePlayPause(): void {
		if (this._isPlaying) {
			this.pause();
		} else {
			this.play();
		}
	}

	/**
   * Start the update loop
   */
	private startUpdateLoop(): void {
		this.stopUpdateLoop();
		this.updateLoop();
	}

	/**
   * Stop the update loop
   */
	private stopUpdateLoop(): void {
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	/**
   * Update loop for smooth playback
   */
	private updateLoop(): void {
		if (!this._isPlaying) {
			return;
		}
    
		const currentTime = performance.now();
		const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
		this.lastUpdateTime = currentTime;
    
		// Update current time
		this._currentTime += deltaTime * this._speed;
    
		// Update timeline with delta time
		this.timeline.update(deltaTime);
    
		// Emit tick event
		this.emitEvent('playback:tick', { 
			currentTime: this._currentTime, 
			deltaTime: deltaTime 
		});
    
		// Check if we've reached the end
		if (this._currentTime >= this._duration) {
			if (this._loop) {
				this._currentTime = 0;
				this.timeline.seek(0);
			} else {
				this._currentTime = this._duration; // Stay at the end
				this._isPlaying = false;
				this.timeline.pause();
				this.emitEvent('playback:complete', { duration: this._duration });
				return;
			}
		}
    
		// Schedule next update
		this.animationFrameId = requestAnimationFrame(() => this.updateLoop());
	}

	/**
   * Dispose of the service
   */
	public dispose(): void {
		this.stopUpdateLoop();
		super.dispose();
	}
}