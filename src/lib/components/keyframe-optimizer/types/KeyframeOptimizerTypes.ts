/**
 * Types for the keyframe optimization system
 * @module KeyframeOptimizerTypes
 * @memberof editor
 */

/**
 * Raw input data point captured during recording
 */
export interface RawDataPoint {
  time: number;
  value: number;
  timestamp: number; // High-precision timestamp for ordering
}

/**
 * Optimization parameters for keyframe generation
 */
export interface KeyframeOptimizationParams {
  /** Minimum time difference between keyframes (in seconds) */
  minTimeDelta: number;
  
  /** Minimum value change threshold to create a keyframe */
  minValueChange: number;
  
  /** Maximum allowed error when simplifying curves */
  maxError: number;
  
  /** Whether to use curve fitting to reduce keyframes */
  useCurveFitting: boolean;
  
  /** Whether to snap keyframes to frame boundaries */
  snapToFrames: boolean;
  
  /** Frame rate for snapping */
  frameRate: number;
  
  /** Whether to remove redundant keyframes */
  removeRedundant: boolean;
  
  /** Smoothing factor for noise reduction (0-1) */
  smoothingFactor: number;
}

/**
 * Default optimization parameters
 */
export const DEFAULT_OPTIMIZATION_PARAMS: KeyframeOptimizationParams = {
	minTimeDelta: 0.1,
	minValueChange: 0.001,
	maxError: 0.01,
	useCurveFitting: true,
	snapToFrames: true,
	frameRate: 60,
	removeRedundant: true,
	smoothingFactor: 0.1
};

/**
 * Optimization result containing keyframes and metadata
 */
export interface OptimizationResult {
  keyframes: Array<{ time: number; value: number }>;
  originalCount: number;
  optimizedCount: number;
  compressionRatio: number;
  processingTime: number;
  metadata: {
    algorithm: string;
    parameters: KeyframeOptimizationParams;
    dataRange: { min: number; max: number };
    timeRange: { start: number; end: number };
  };
}

/**
 * Raw data container for a single property
 */
export interface PropertyRawData {
  propertyName: string;
  dataPoints: RawDataPoint[];
  recordingStartTime: number;
  recordingEndTime: number;
  totalSamples: number;
  averageSampleRate: number;
}

/**
 * Event types for the keyframe optimizer
 */
export interface KeyframeOptimizerEventMap {
  [key: string]: unknown;
  'data:capture': { propertyName: string; time: number; value: number };
  'recording:start': { propertyName: string; startTime: number };
  'recording:stop': { propertyName: string; endTime: number; sampleCount: number };
  'optimization:complete': { propertyName: string; result: OptimizationResult };
  'optimization:error': { propertyName: string; error: string };
}

/**
 * Keyframe optimization algorithms
 */
export enum OptimizationAlgorithm {
  DOUGLAS_PEUCKER = 'douglas-peucker',
  MOVING_AVERAGE = 'moving-average',
  THRESHOLD_BASED = 'threshold-based',
  CURVE_FITTING = 'curve-fitting'
}