/**
 * Timeline Component exports
 * @module timeline
 * @memberof editor
 */

// Components
export { default as TimelineContainer } from './TimelineContainer.svelte';
export { default as TimelineControls } from './TimelineControls.svelte';
export { default as TimelineRuler } from './TimelineRuler.svelte';
export { default as TimelineTrack } from './TimelineTrack.svelte';

// Services
export { PlaybackService } from './services/PlaybackService.js';
export { KeyframeService } from './services/KeyframeService.js';

// Types
export type {
	TimelineConfig,
	TimelineState,
	TimelineViewport,
	TimelineTrackConfig,
	TimelineTheme,
	TimelineComponentEventMap,
	RecordingState,
	InterpolationType,
	EasingPreset,
	TimelineItem,
	Rectangle
} from './types/TimelineTypes.js';

export {
	DEFAULT_TIMELINE_THEME,
	EASING_PRESETS
} from './types/TimelineTypes.js';

// Utils
export {
	timeToPixel,
	pixelToTime,
	timeToFrame,
	frameToTime,
	formatTime,
	formatTimeSeconds,
	snapToGrid,
	calculateRulerTicks,
	clamp,
	generateId,
	mergeTheme,
	getKeyframeBounds,
	isPointInDiamond,
	debounce,
	throttle,
	calculateFitZoom,
	interpolateValue
} from './utils/TimelineUtils.js';