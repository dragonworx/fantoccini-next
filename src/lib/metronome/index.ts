/**
 * @namespace metronome
 * @description A comprehensive module for musical timing, rhythm generation, and precise
 * tempo control. This module provides components for building applications
 * that require musical timing, such as:
 *
 * - Digital metronomes
 * - Music production tools
 * - Rhythm training applications
 * - Animation synchronized to music
 *
 * @example
 * import { Metronome, Rhythm, TimeSignature } from './metronome';
 *
 * // Create a rhythm in 4/4 time at 120 BPM
 * const rhythm = new Rhythm({
 *   bpm: 120,
 *   timeSignature: TimeSignature.four_four,
 *   subDivisions: 1
 * });
 *
 * // Create and start a metronome
 * const metronome = new Metronome(rhythm);
 * metronome.onPulse(pulse => {
 *   if (pulse.isDownBeat) {
 *     console.log(`Beat ${pulse.beat} of measure ${pulse.measure}`);
 *   }
 * });
 *
 * metronome.start();
 */

import { Metronome } from "./metronome";
import { MetronomeScheduler } from "./metronome_scheduler";
import { TimeSignature } from "./time_signature";
import {
  Rhythm,
  quarter,
  quaver,
  semiquaver,
  demisemiquaver,
  hemidemisemiquaver,
  semihemidemisemiquaver,
  demisemihemidemisemiquaver,
} from "./rhythm";

/**
 * Main exports from the metronome module.
 * These components provide a complete system for musical timing.
 *
 * @memberof metronome
 * @see {@link metronome.Metronome} - The main metronome class
 * @see {@link metronome.TimeSignature} - Musical time signature representation
 * @see {@link metronome.Rhythm} - Defines tempo, time signature, and subdivisions
 */
export {
  Metronome,
  MetronomeScheduler,
  TimeSignature,
  Rhythm,
  quarter,
  quaver,
  semiquaver,
  demisemiquaver,
  hemidemisemiquaver,
  semihemidemisemiquaver,
  demisemihemidemisemiquaver,
};
