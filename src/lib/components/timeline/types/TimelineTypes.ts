/**
 * Type definitions for the Timeline Component
 * @module TimelineTypes
 * @memberof editor
 */

import type { ITimeline, IKeyframe, ITimelineObject } from '../../../core/timeline/index.js';
import type { Sprite } from '../../../core/object/sprite.js';
import type { Metronome } from '../../../core/metronome/index.js';

/**
 * Timeline component event map with type-safe payloads
 */
export interface TimelineComponentEventMap {
  [key: string]: unknown;
  // Playback Events
  'playback:play': { currentTime: number; speed: number };
  'playback:pause': { currentTime: number };
  'playback:stop': { currentTime: number };
  'playback:seek': { time: number; frame: number };
  'playback:tick': { currentTime: number; deltaTime: number };
  'playback:complete': { duration: number };
  
  // Keyframe Events
  'keyframe:add': { trackId: string; keyframeId: string; time: number; value: any };
  'keyframe:remove': { trackId: string; keyframeId: string };
  'keyframe:move': { trackId: string; keyframeId: string; oldTime: number; newTime: number };
  'keyframe:edit': { trackId: string; keyframeId: string; oldValue: any; newValue: any };
  'keyframe:select': { trackId: string; keyframeIds: string[]; multiSelect: boolean };
  'keyframe:deselect': { trackId: string; keyframeIds: string[] };
  
  // Track Events
  'track:add': { trackId: string; property: string; sprite: Sprite };
  'track:remove': { trackId: string };
  'track:toggle': { trackId: string; visible: boolean };
  'track:mute': { trackId: string; muted: boolean };
  
  // Recording Events
  'recording:start': { inTime: number; outTime: number };
  'recording:stop': { keyframesRecorded: number };
  'recording:capture': { time: number; property: string; value: any };
  
  // Viewport Events
  'viewport:pan': { offset: number; deltaX: number };
  'viewport:zoom': { scale: number; centerTime: number };
  'viewport:resize': { width: number; height: number };
}

/**
 * Timeline track configuration
 */
export interface TimelineTrackConfig {
  id: string;
  sprite: Sprite;
  property: string;
  label: string;
  color: string;
  visible: boolean;
  muted: boolean;
  height: number;
  keyframes: IKeyframe<any>[];
}

/**
 * Timeline viewport configuration
 */
export interface TimelineViewport {
  startTime: number;
  endTime: number;
  scale: number;
  offsetX: number;
  width: number;
  height: number;
}

/**
 * Timeline theme configuration
 */
export interface TimelineTheme {
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    text: string;
    textMuted: string;
    keyframe: string;
    keyframeSelected: string;
    keyframeHover: string;
    track: string;
    trackBorder: string;
    ruler: string;
    rulerText: string;
    playhead: string;
    recordingRegion: string;
  };
  
  keyframes: {
    size: number;
    borderWidth: number;
    shape: 'diamond' | 'circle' | 'square';
  };
  
  tracks: {
    height: number;
    spacing: number;
    borderWidth: number;
  };
  
  ruler: {
    height: number;
    majorTickHeight: number;
    minorTickHeight: number;
    textSize: number;
  };
}

/**
 * Timeline component configuration
 */
export interface TimelineConfig {
  timeline: ITimeline;
  metronome: Metronome;
  sprites: Sprite[];
  width?: number;
  height?: number;
  theme?: Partial<TimelineTheme>;
  framerate?: number;
  duration?: number;
  loop?: boolean;
  autoPlay?: boolean;
  showRuler?: boolean;
  showControls?: boolean;
  recordingEnabled?: boolean;
  inMarker?: number;
  outMarker?: number;
}

/**
 * Recording state
 */
export interface RecordingState {
  enabled: boolean;
  active: boolean;
  inTime: number;
  outTime: number;
  capturedKeyframes: Map<string, IKeyframe[]>;
}

/**
 * Timeline state
 */
export interface TimelineState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  framerate: number;
  loop: boolean;
  speed: number;
  tracks: TimelineTrackConfig[];
  viewport: TimelineViewport;
  recording: RecordingState;
  selectedKeyframes: Set<string>;
}

/**
 * Keyframe interpolation types
 */
export type InterpolationType = 'Linear' | 'Step' | 'Bezier' | 'CatmullRom';

/**
 * Keyframe easing presets
 */
export interface EasingPreset {
  name: string;
  type: InterpolationType;
  controlPoints?: [number, number, number, number];
}

/**
 * Timeline item for selection
 */
export interface TimelineItem {
  type: 'keyframe' | 'track' | 'marker';
  id: string;
  trackId?: string;
  time?: number;
}

/**
 * Rectangle for bounds and selection
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Default timeline theme
 */
export const DEFAULT_TIMELINE_THEME: TimelineTheme = {
	colors: {
		background: '#1a1a1a',
		foreground: '#2a2a2a',
		primary: '#4f8cff',
		secondary: '#3a3a3a',
		accent: '#ff6b6b',
		border: '#333333',
		text: '#ffffff',
		textMuted: '#999999',
		keyframe: '#4f8cff',
		keyframeSelected: '#ff6b6b',
		keyframeHover: '#64a3ff',
		track: '#2a2a2a',
		trackBorder: '#3a3a3a',
		ruler: '#1a1a1a',
		rulerText: '#cccccc',
		playhead: '#ff6b6b',
		recordingRegion: 'rgba(255, 107, 107, 0.2)',
	},
  
	keyframes: {
		size: 8,
		borderWidth: 1,
		shape: 'diamond',
	},
  
	tracks: {
		height: 32,
		spacing: 2,
		borderWidth: 1,
	},
  
	ruler: {
		height: 40,
		majorTickHeight: 12,
		minorTickHeight: 6,
		textSize: 11,
	},
};

/**
 * Default easing presets
 */
export const EASING_PRESETS: EasingPreset[] = [
	{ name: 'Linear', type: 'Linear' },
	{ name: 'Step', type: 'Step' },
	{ name: 'Ease', type: 'Bezier', controlPoints: [0.25, 0.1, 0.25, 1] },
	{ name: 'Ease In', type: 'Bezier', controlPoints: [0.42, 0, 1, 1] },
	{ name: 'Ease Out', type: 'Bezier', controlPoints: [0, 0, 0.58, 1] },
	{ name: 'Ease In Out', type: 'Bezier', controlPoints: [0.42, 0, 0.58, 1] },
];