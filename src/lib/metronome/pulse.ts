export class Pulse {
  /** Current pulse within the measure */
  readonly pulse: number;
  /** Total pulses in the current measure */
  readonly pulses: number;
  /** Subdivisions per beat */
  readonly subdivs: number;
  /** Completion percentage of the current measure (0.0 - 1.0) */
  readonly complete: number;
  /** Current measure count */
  readonly measure: number;
  /** Current beat within the measure */
  readonly beat: number;
  /** Indicates if this pulse is the first pulse of a new beat */
  readonly isNewBeat: boolean;

  constructor(params: {
    pulse: number;
    pulses: number;
    subdivs: number;
    complete: number;
    measure: number;
    beat: number;
    isNewBeat: boolean;
  }) {
    this.pulse = params.pulse;
    this.pulses = params.pulses;
    this.subdivs = params.subdivs;
    this.complete = params.complete;
    this.measure = params.measure;
    this.beat = params.beat;
    this.isNewBeat = params.isNewBeat;
  }
}
