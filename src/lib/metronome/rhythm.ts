import { TimeSignature } from "./time_signature";

// NoteDivision type and values for subDivision property
export type NoteDivision = 1 | 2 | 4 | 8 | 16 | 32 | 64;

export const quarter: NoteDivision = 1;
export const quaver: NoteDivision = 2;
export const semiquaver: NoteDivision = 4;
export const demisemiquaver: NoteDivision = 8;
export const hemidemisemiquaver: NoteDivision = 16;
export const semihemidemisemiquaver: NoteDivision = 32;
export const demisemihemidemisemiquaver: NoteDivision = 64;

export class Rhythm {
  bpm: number;
  timeSignature: TimeSignature;
  subDivisions: number;
  customGrouping?: number[]; // Example: [3, 2, 2] for 7/8 time signature
  variableSubDivisions?: number[]; // Example: [2, 3, 2] for different subdivisions in each beat

  constructor(options: {
    bpm: number;
    timeSignature?: TimeSignature;
    subDivisions?: number;
    customGrouping?: number[];
    variableSubDivisions?: number[];
  }) {
    this.bpm = options.bpm;
    this.timeSignature = options.timeSignature ?? TimeSignature.four_four;
    this.subDivisions = options.subDivisions ?? 1;
    this.customGrouping = options.customGrouping;
    this.variableSubDivisions = options.variableSubDivisions;
  }

  get pulsesPerMeasure(): number {
    if (this.customGrouping) {
      const groupSum = this.customGrouping.reduce((a, b) => a + b, 0);
      const subdivSum = this.variableSubDivisions
        ? this.variableSubDivisions.reduce((a, b) => a + b, 0)
        : this.subDivisions;
      return groupSum * subdivSum;
    }
    return this.timeSignature.upper * this.subDivisions;
  }
}
