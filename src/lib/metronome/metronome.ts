import { Rhythm } from "./rhythm";
import { MetronomeScheduler } from "./metronome_scheduler";
import { Pulse } from "./pulse";

type MetronomeEvent = "start" | "stop" | "pause" | "resume" | "updated";

type EventListener = (event: MetronomeEvent) => void;
type PulseListener = (pulse: Pulse) => void;

export class Metronome {
  settings: Rhythm;
  readonly timer: MetronomeScheduler;

  private eventListeners: Set<EventListener> = new Set();
  private pulseListeners: Set<PulseListener> = new Set();

  private _isInitialized = false;
  private _pulse = 1;
  private _measure = 1;
  private _beat = 1;
  private _currentGroupIndex = 0;

  constructor(settings: Rhythm) {
    this.settings = settings;
    this.timer = new MetronomeScheduler();
    this.timer.onPulse((pulse) => {
      this.pulseListeners.forEach((listener) => listener(pulse));
    });
  }

  onEvent(listener: EventListener) {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  onPulse(listener: PulseListener) {
    this.pulseListeners.add(listener);
    return () => this.pulseListeners.delete(listener);
  }

  async manualPulse(pulses: number = 1): Promise<void> {
    if (!this._isInitialized) {
      this._initializeMetronome();
    }
    for (let i = 0; i < pulses; i++) {
      this._onPulse();
    }
    await Promise.resolve();
  }

  private _initializeMetronome() {
    this._resetCounters();
    this._isInitialized = true;
  }

  start() {
    this._emitEvent("start");
    this._resetCounters();
    this.timer.start(this._calculateTempoBeat(), () => this._onPulse());
  }

  stop() {
    this.timer.stop();
    this._emitEvent("stop");
    this._resetCounters();
  }

  pause() {
    this.timer.pause();
    this._emitEvent("pause");
  }

  resume() {
    this._emitEvent("resume");
    this.timer.resume(this._calculateTempoBeat(), () => this._onPulse());
  }

  update(newSettings: Rhythm) {
    this.settings = newSettings;
    this._resetCounters();
    this.timer.stop();
    this.timer.start(this._calculateTempoBeat(), () => this._onPulse());
    this._emitEvent("updated");
  }

  private _resetCounters() {
    this._pulse = 1;
    this._measure = 1;
    this._beat = 1;
    this._currentGroupIndex = 0;
  }

  private _onPulse() {
    const { settings } = this;
    let pulsesInCurrentGroup =
      settings.customGrouping &&
      this._currentGroupIndex < settings.customGrouping.length
        ? settings.customGrouping[this._currentGroupIndex]
        : settings.timeSignature.upper;

    const subdivisionsInCurrentBeat = settings.subDivisions;

    const pulseObj = new Pulse({
      pulse: this._pulse,
      pulses: settings.pulsesPerMeasure,
      subdivs: subdivisionsInCurrentBeat,
      complete: (this._pulse - 1) / settings.pulsesPerMeasure,
      measure: this._measure,
      beat: this._beat,
      isDownBeat: (this._pulse - 1) % subdivisionsInCurrentBeat === 0,
    });

    this.timer.emitPulse(pulseObj);

    this._pulse++;

    if (this._pulse > settings.pulsesPerMeasure) {
      this._pulse = 1;
      this._measure++;
      this._beat = 1;
      this._currentGroupIndex = 0;
    } else {
      if ((this._pulse - 1) % subdivisionsInCurrentBeat === 0) {
        this._beat++;
      }

      if (
        settings.timeSignature.upper === 12 &&
        subdivisionsInCurrentBeat === 3
      ) {
        if ((this._pulse - 1) % 12 === 0) {
          this._beat = 1;
          this._measure++;
        }
      } else {
        if (this._beat > pulsesInCurrentGroup) {
          this._beat = 1;
          this._currentGroupIndex =
            (this._currentGroupIndex + 1) %
            (settings.customGrouping?.length ?? 1);
        }
      }
    }
  }

  private _calculateTempoBeat(): number {
    const { bpm, subDivisions, timeSignature } = this.settings;
    return (60000 / bpm / subDivisions) * (4 / timeSignature.lower);
  }

  private _emitEvent(eventType: MetronomeEvent) {
    this.eventListeners.forEach((listener) => listener(eventType));
  }

  dispose() {
    this.timer.dispose();
    this.eventListeners.clear();
    this.pulseListeners.clear();
  }
}
