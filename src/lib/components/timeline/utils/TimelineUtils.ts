/**
 * Utility functions for timeline operations
 * @module TimelineUtils
 * @memberof editor
 */

import type { TimelineViewport, TimelineTheme } from '../types/TimelineTypes.js';

/**
 * Converts time in seconds to pixel position
 */
export function timeToPixel(time: number, viewport: TimelineViewport): number {
  const timeRange = viewport.endTime - viewport.startTime;
  const normalizedTime = (time - viewport.startTime) / timeRange;
  return normalizedTime * viewport.width + viewport.offsetX;
}

/**
 * Converts pixel position to time in seconds
 */
export function pixelToTime(pixel: number, viewport: TimelineViewport): number {
  const timeRange = viewport.endTime - viewport.startTime;
  const normalizedX = (pixel - viewport.offsetX) / viewport.width;
  return viewport.startTime + normalizedX * timeRange;
}

/**
 * Converts time in seconds to frame number
 */
export function timeToFrame(time: number, framerate: number): number {
  return Math.round(time * framerate);
}

/**
 * Converts frame number to time in seconds
 */
export function frameToTime(frame: number, framerate: number): number {
  return frame / framerate;
}

/**
 * Formats time for display (MM:SS.FF)
 */
export function formatTime(time: number, framerate: number): string {
  const totalFrames = Math.round(time * framerate);
  const seconds = Math.floor(time);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const frames = totalFrames % framerate;
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
}

/**
 * Formats time for display (seconds only)
 */
export function formatTimeSeconds(time: number): string {
  return `${time.toFixed(2)}s`;
}

/**
 * Snaps time to grid based on framerate
 */
export function snapToGrid(time: number, framerate: number): number {
  const frameTime = 1 / framerate;
  return Math.round(time / frameTime) * frameTime;
}

/**
 * Calculates ruler tick positions and labels
 */
export function calculateRulerTicks(viewport: TimelineViewport, framerate: number): {
  major: Array<{ time: number; position: number; label: string }>;
  minor: Array<{ time: number; position: number }>;
} {
  const major: Array<{ time: number; position: number; label: string }> = [];
  const minor: Array<{ time: number; position: number }> = [];
  
  const timeRange = viewport.endTime - viewport.startTime;
  const pixelsPerSecond = viewport.width / timeRange;
  
  // Determine appropriate tick intervals
  let majorInterval = 1; // 1 second
  let minorInterval = 1 / framerate; // 1 frame
  
  if (pixelsPerSecond < 50) {
    majorInterval = 5; // 5 seconds
    minorInterval = 1; // 1 second
  } else if (pixelsPerSecond < 20) {
    majorInterval = 10; // 10 seconds
    minorInterval = 1; // 1 second
  } else if (pixelsPerSecond > 200) {
    majorInterval = 0.5; // 0.5 seconds
    minorInterval = 1 / framerate; // 1 frame
  }
  
  // Generate major ticks
  const startMajor = Math.floor(viewport.startTime / majorInterval) * majorInterval;
  for (let time = startMajor; time <= viewport.endTime; time += majorInterval) {
    if (time >= viewport.startTime) {
      major.push({
        time,
        position: timeToPixel(time, viewport),
        label: formatTimeSeconds(time)
      });
    }
  }
  
  // Generate minor ticks
  const startMinor = Math.floor(viewport.startTime / minorInterval) * minorInterval;
  for (let time = startMinor; time <= viewport.endTime; time += minorInterval) {
    if (time >= viewport.startTime && time % majorInterval !== 0) {
      minor.push({
        time,
        position: timeToPixel(time, viewport)
      });
    }
  }
  
  return { major, minor };
}

/**
 * Clamps a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generates a unique ID for timeline items
 */
export function generateId(prefix: string = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Merges theme objects with defaults
 */
export function mergeTheme(theme: Partial<TimelineTheme>, defaults: TimelineTheme): TimelineTheme {
  return {
    colors: { ...defaults.colors, ...theme.colors },
    keyframes: { ...defaults.keyframes, ...theme.keyframes },
    tracks: { ...defaults.tracks, ...theme.tracks },
    ruler: { ...defaults.ruler, ...theme.ruler },
  };
}

/**
 * Calculates the bounds of a diamond-shaped keyframe
 */
export function getKeyframeBounds(x: number, y: number, size: number): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  const halfSize = size / 2;
  return {
    left: x - halfSize,
    top: y - halfSize,
    right: x + halfSize,
    bottom: y + halfSize,
  };
}

/**
 * Tests if a point is inside a diamond shape
 */
export function isPointInDiamond(pointX: number, pointY: number, centerX: number, centerY: number, size: number): boolean {
  const dx = Math.abs(pointX - centerX);
  const dy = Math.abs(pointY - centerY);
  const halfSize = size / 2;
  return (dx + dy) <= halfSize;
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttles a function call
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Calculates the optimal zoom level to fit a time range
 */
export function calculateFitZoom(
  startTime: number,
  endTime: number,
  containerWidth: number,
  padding: number = 20
): { scale: number; offsetX: number } {
  const timeRange = endTime - startTime;
  const availableWidth = containerWidth - (padding * 2);
  const scale = availableWidth / timeRange;
  const offsetX = padding;
  
  return { scale, offsetX };
}

/**
 * Interpolates between two values using the specified easing
 */
export function interpolateValue(
  startValue: number,
  endValue: number,
  progress: number,
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' = 'linear'
): number {
  let easedProgress = progress;
  
  switch (easing) {
    case 'easeIn':
      easedProgress = progress * progress;
      break;
    case 'easeOut':
      easedProgress = 1 - (1 - progress) * (1 - progress);
      break;
    case 'easeInOut':
      easedProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      break;
  }
  
  return startValue + (endValue - startValue) * easedProgress;
}