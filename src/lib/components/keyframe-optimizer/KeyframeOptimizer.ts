/**
 * Production-grade keyframe optimization system
 * @module KeyframeOptimizer
 * @memberof editor
 */

import { EventEmitter } from '../../../core/event-emitter.js';
import type {
	RawDataPoint,
	KeyframeOptimizationParams,
	OptimizationResult,
	PropertyRawData,
	KeyframeOptimizerEventMap,
	OptimizationAlgorithm
} from './types/KeyframeOptimizerTypes.js';
import { DEFAULT_OPTIMIZATION_PARAMS } from './types/KeyframeOptimizerTypes.js';

/**
 * Main keyframe optimization class
 * Captures raw input data and converts it to optimized keyframes
 */
export class KeyframeOptimizer extends EventEmitter<KeyframeOptimizerEventMap> {
	private rawData: Map<string, PropertyRawData> = new Map();
	private isRecording: boolean = false;
	private recordingStartTime: number = 0;
	private currentRecordingProperties: Set<string> = new Set();

	constructor() {
		super();
	}

	/**
   * Start recording raw data for specified properties
   */
	public startRecording(propertyNames: string[]): void {
		if (this.isRecording) {
			throw new Error('Already recording. Stop current recording first.');
		}

		this.isRecording = true;
		this.recordingStartTime = performance.now();
		this.currentRecordingProperties = new Set(propertyNames);

		// Initialize raw data containers
		for (const propertyName of propertyNames) {
			this.rawData.set(propertyName, {
				propertyName,
				dataPoints: [],
				recordingStartTime: this.recordingStartTime,
				recordingEndTime: 0,
				totalSamples: 0,
				averageSampleRate: 0
			});

			this.emitEvent('recording:start', {
				propertyName,
				startTime: this.recordingStartTime
			});
		}
	}

	/**
   * Stop recording and return the captured raw data
   */
	public stopRecording(): Map<string, PropertyRawData> {
		if (!this.isRecording) {
			throw new Error('Not currently recording.');
		}

		const endTime = performance.now();
		const recordingDuration = endTime - this.recordingStartTime;

		// Finalize raw data
		for (const propertyName of this.currentRecordingProperties) {
			const data = this.rawData.get(propertyName);
			if (data) {
				data.recordingEndTime = endTime;
				data.averageSampleRate = data.totalSamples / (recordingDuration / 1000);

				this.emitEvent('recording:stop', {
					propertyName,
					endTime,
					sampleCount: data.totalSamples
				});
			}
		}

		this.isRecording = false;
		this.currentRecordingProperties.clear();

		return new Map(this.rawData);
	}

	/**
   * Capture a single data point
   */
	public captureDataPoint(propertyName: string, time: number, value: number): void {
		if (!this.isRecording || !this.currentRecordingProperties.has(propertyName)) {
			return;
		}

		const data = this.rawData.get(propertyName);
		if (!data) {
			return;
		}

		const dataPoint: RawDataPoint = {
			time,
			value,
			timestamp: performance.now()
		};

		data.dataPoints.push(dataPoint);
		data.totalSamples++;

		this.emitEvent('data:capture', {
			propertyName,
			time,
			value
		});
	}

	/**
   * Optimize raw data to keyframes using specified parameters
   */
	public optimizeToKeyframes(
		propertyName: string,
		params: Partial<KeyframeOptimizationParams> = {}
	): OptimizationResult {
		const data = this.rawData.get(propertyName);
		if (!data || data.dataPoints.length === 0) {
			throw new Error(`No raw data found for property: ${propertyName}`);
		}

		const startTime = performance.now();
		const optimizationParams = { ...DEFAULT_OPTIMIZATION_PARAMS, ...params };
    
		try {
			// Sort data points by time
			const sortedData = [...data.dataPoints].sort((a, b) => a.time - b.time);
      
			// Apply smoothing if enabled
			const smoothedData = optimizationParams.smoothingFactor > 0 
				? this.applySmoothingFilter(sortedData, optimizationParams.smoothingFactor)
				: sortedData;

			// Apply main optimization algorithm
			let optimizedPoints: Array<{ time: number; value: number }>;
      
			if (optimizationParams.useCurveFitting) {
				optimizedPoints = this.douglasPeuckerOptimization(smoothedData, optimizationParams);
			} else {
				optimizedPoints = this.thresholdBasedOptimization(smoothedData, optimizationParams);
			}

			// Remove redundant keyframes if enabled
			if (optimizationParams.removeRedundant) {
				optimizedPoints = this.removeRedundantKeyframes(optimizedPoints, optimizationParams);
			}

			// Snap to frame boundaries if enabled
			if (optimizationParams.snapToFrames) {
				optimizedPoints = this.snapToFrameBoundaries(optimizedPoints, optimizationParams.frameRate);
			}

			const processingTime = performance.now() - startTime;
			const result: OptimizationResult = {
				keyframes: optimizedPoints,
				originalCount: data.dataPoints.length,
				optimizedCount: optimizedPoints.length,
				compressionRatio: optimizedPoints.length / data.dataPoints.length,
				processingTime,
				metadata: {
					algorithm: optimizationParams.useCurveFitting ? 'douglas-peucker' : 'threshold-based',
					parameters: optimizationParams,
					dataRange: this.calculateDataRange(data.dataPoints),
					timeRange: {
						start: data.dataPoints[0]?.time || 0,
						end: data.dataPoints[data.dataPoints.length - 1]?.time || 0
					}
				}
			};

			this.emitEvent('optimization:complete', {
				propertyName,
				result
			});

			return result;
		} catch (error) {
			this.emitEvent('optimization:error', {
				propertyName,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		}
	}

	/**
   * Get raw data for a property
   */
	public getRawData(propertyName: string): PropertyRawData | undefined {
		return this.rawData.get(propertyName);
	}

	/**
   * Clear raw data for a property
   */
	public clearRawData(propertyName: string): void {
		this.rawData.delete(propertyName);
	}

	/**
   * Clear all raw data
   */
	public clearAllRawData(): void {
		this.rawData.clear();
	}

	/**
   * Get recording status
   */
	public getRecordingStatus(): { isRecording: boolean; properties: string[] } {
		return {
			isRecording: this.isRecording,
			properties: Array.from(this.currentRecordingProperties)
		};
	}

	/**
   * Apply smoothing filter to reduce noise
   */
	private applySmoothingFilter(data: RawDataPoint[], factor: number): RawDataPoint[] {
		if (data.length <= 1) {
			return data;
		}

		const smoothed: RawDataPoint[] = [data[0]];
    
		for (let i = 1; i < data.length; i++) {
			const prevSmoothed = smoothed[i - 1];
			const current = data[i];
      
			const smoothedValue = prevSmoothed.value * (1 - factor) + current.value * factor;
      
			smoothed.push({
				...current,
				value: smoothedValue
			});
		}

		return smoothed;
	}

	/**
   * Douglas-Peucker algorithm for curve simplification
   */
	private douglasPeuckerOptimization(
		data: RawDataPoint[],
		params: KeyframeOptimizationParams
	): Array<{ time: number; value: number }> {
		if (data.length <= 2) {
			return data.map(p => ({ time: p.time, value: p.value }));
		}

		const points = data.map(p => ({ time: p.time, value: p.value }));
		return this.douglasPeucker(points, params.maxError);
	}

	/**
   * Threshold-based optimization
   */
	private thresholdBasedOptimization(
		data: RawDataPoint[],
		params: KeyframeOptimizationParams
	): Array<{ time: number; value: number }> {
		if (data.length === 0) {
			return [];
		}

		const result: Array<{ time: number; value: number }> = [];
		let lastKeyframe = data[0];
		result.push({ time: lastKeyframe.time, value: lastKeyframe.value });

		for (let i = 1; i < data.length; i++) {
			const current = data[i];
			const timeDelta = current.time - lastKeyframe.time;
			const valueDelta = Math.abs(current.value - lastKeyframe.value);

			if (timeDelta >= params.minTimeDelta && valueDelta >= params.minValueChange) {
				result.push({ time: current.time, value: current.value });
				lastKeyframe = current;
			}
		}

		// Always include the last point
		if (data.length > 1) {
			const lastPoint = data[data.length - 1];
			const lastResultPoint = result[result.length - 1];
			if (lastPoint.time !== lastResultPoint.time) {
				result.push({ time: lastPoint.time, value: lastPoint.value });
			}
		}

		return result;
	}

	/**
   * Douglas-Peucker curve simplification algorithm
   */
	private douglasPeucker(
		points: Array<{ time: number; value: number }>,
		epsilon: number
	): Array<{ time: number; value: number }> {
		if (points.length <= 2) {
			return points;
		}

		// Find the point with maximum distance from the line segment
		let maxDistance = 0;
		let maxIndex = 0;
		const start = points[0];
		const end = points[points.length - 1];

		for (let i = 1; i < points.length - 1; i++) {
			const distance = this.perpendicularDistance(points[i], start, end);
			if (distance > maxDistance) {
				maxDistance = distance;
				maxIndex = i;
			}
		}

		// If max distance is greater than epsilon, recursively simplify
		if (maxDistance > epsilon) {
			const left = this.douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
			const right = this.douglasPeucker(points.slice(maxIndex), epsilon);
      
			// Combine results, removing duplicate point at the join
			return [...left.slice(0, -1), ...right];
		} else {
			// All points are close to the line, return just the endpoints
			return [start, end];
		}
	}

	/**
   * Calculate perpendicular distance from point to line segment
   */
	private perpendicularDistance(
		point: { time: number; value: number },
		lineStart: { time: number; value: number },
		lineEnd: { time: number; value: number }
	): number {
		const { time: x, value: y } = point;
		const { time: x1, value: y1 } = lineStart;
		const { time: x2, value: y2 } = lineEnd;

		const A = x - x1;
		const B = y - y1;
		const C = x2 - x1;
		const D = y2 - y1;

		const dot = A * C + B * D;
		const lenSq = C * C + D * D;
    
		if (lenSq === 0) {
			return Math.sqrt(A * A + B * B);
		}

		const param = dot / lenSq;
		let xx, yy;

		if (param < 0) {
			xx = x1;
			yy = y1;
		} else if (param > 1) {
			xx = x2;
			yy = y2;
		} else {
			xx = x1 + param * C;
			yy = y1 + param * D;
		}

		const dx = x - xx;
		const dy = y - yy;
		return Math.sqrt(dx * dx + dy * dy);
	}

	/**
   * Remove redundant keyframes
   */
	private removeRedundantKeyframes(
		keyframes: Array<{ time: number; value: number }>,
		params: KeyframeOptimizationParams
	): Array<{ time: number; value: number }> {
		if (keyframes.length <= 2) {
			return keyframes;
		}

		const result: Array<{ time: number; value: number }> = [keyframes[0]];

		for (let i = 1; i < keyframes.length - 1; i++) {
			const prev = keyframes[i - 1];
			const current = keyframes[i];
			const next = keyframes[i + 1];

			// Check if current keyframe is necessary
			const isRedundant = Math.abs(current.value - prev.value) < params.minValueChange &&
                         Math.abs(next.value - current.value) < params.minValueChange;

			if (!isRedundant) {
				result.push(current);
			}
		}

		// Always include the last keyframe
		result.push(keyframes[keyframes.length - 1]);
		return result;
	}

	/**
   * Snap keyframes to frame boundaries
   */
	private snapToFrameBoundaries(
		keyframes: Array<{ time: number; value: number }>,
		frameRate: number
	): Array<{ time: number; value: number }> {
		const frameDuration = 1 / frameRate;
    
		return keyframes.map(keyframe => ({
			...keyframe,
			time: Math.round(keyframe.time / frameDuration) * frameDuration
		}));
	}

	/**
   * Calculate data range for metadata
   */
	private calculateDataRange(data: RawDataPoint[]): { min: number; max: number } {
		if (data.length === 0) {
			return { min: 0, max: 0 };
		}

		let min = data[0].value;
		let max = data[0].value;

		for (const point of data) {
			if (point.value < min) {
				min = point.value;
			}
			if (point.value > max) {
				max = point.value;
			}
		}

		return { min, max };
	}

	/**
   * Dispose of the optimizer
   */
	public dispose(): void {
		this.rawData.clear();
		this.isRecording = false;
		this.currentRecordingProperties.clear();
		super.dispose();
	}
}