/**
 * Animation system exports
 * @module animation
 * @memberof editor
 */

export { Clip } from './Clip.js';
export { AnimatableProperty } from './AnimatableProperty.js';
export { AnimatableObject } from './AnimatableObject.js';

export type {
	IClip,
	IAnimatableProperty,
	RawDataPoint,
	ClipKeyframe,
	ClipMetadata,
	ClipConfig,
	AnimatablePropertyConfig,
	ClipEventMap,
	AnimatablePropertyEventMap
} from './types/ClipTypes.js';

export type {
	AnimatableObjectConfig,
	AnimatableObjectEventMap
} from './AnimatableObject.js';