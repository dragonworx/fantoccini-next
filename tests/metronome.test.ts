import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Metronome, quaver } from "../src/lib/metronome";
import { Rhythm, TimeSignature } from "../src/lib/metronome";
import { MetronomeScheduler } from "../src/lib/metronome/";
import { Pulse } from "../src/lib/metronome/pulse";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("TimeSignature", () => {
  it("should create a default 4/4 time signature", () => {
    const ts = TimeSignature.four_four;
    expect(ts.upper).toBe(4);
    expect(ts.lower).toBe(4);
  });

  it("should create a custom time signature", () => {
    const ts = new TimeSignature(7, 8);
    expect(ts.upper).toBe(7);
    expect(ts.lower).toBe(8);
  });
});

describe("Rhythm", () => {
  it("should calculate pulsesPerMeasure for standard time signature", () => {
    const settings = new Rhythm({
      bpm: 120,
      timeSignature: new TimeSignature(4, 4),
      subDivisions: quaver,
    });
    expect(settings.pulsesPerMeasure).toBe(8);
  });

  it("should calculate pulsesPerMeasure for custom grouping", () => {
    const settings = new Rhythm({
      bpm: 100,
      timeSignature: new TimeSignature(7, 8),
      subDivisions: quaver,
      customGrouping: [3, 2, 2],
    });
    expect(settings.pulsesPerMeasure).toBe(14);
  });

  it("should calculate pulsesPerMeasure for custom grouping and variable subdivisions", () => {
    const settings = new Rhythm({
      bpm: 100,
      timeSignature: new TimeSignature(7, 8),
      subDivisions: quaver,
      customGrouping: [3, 2, 2],
      variableSubDivisions: [2, 3, 2],
    });
    expect(settings.pulsesPerMeasure).toBe((3 + 2 + 2) * (2 + 3 + 2));
  });
});

describe("Pulse", () => {
  it("should create a Pulse with correct properties", () => {
    const pulse = new Pulse({
      pulse: 2,
      pulses: 8,
      subdivs: 2,
      complete: 0.125,
      measure: 1,
      beat: 1,
      isDownBeat: false,
    });
    expect(pulse.pulse).toBe(2);
    expect(pulse.pulses).toBe(8);
    expect(pulse.subdivs).toBe(2);
    expect(pulse.complete).toBe(0.125);
    expect(pulse.measure).toBe(1);
    expect(pulse.beat).toBe(1);
    expect(pulse.isDownBeat).toBe(false);
  });
});

describe("MetronomeScheduler", () => {
  let scheduler: MetronomeScheduler;

  beforeEach(() => {
    scheduler = new MetronomeScheduler();
  });

  afterEach(() => {
    scheduler.dispose();
  });

  it("should emit pulses at the correct interval", async () => {
    const pulses: Pulse[] = [];
    const pulseObj = new Pulse({
      pulse: 1,
      pulses: 4,
      subdivs: 1,
      complete: 0,
      measure: 1,
      beat: 1,
      isDownBeat: true,
    });

    scheduler.onPulse((p) => pulses.push(p));
    let count = 0;
    scheduler.start(50, () => {
      scheduler.emitPulse(pulseObj);
      count++;
      if (count >= 3) scheduler.stop();
    });

    await wait(200);
    expect(pulses.length).toBeGreaterThanOrEqual(3);
    expect(pulses[0]).toBeInstanceOf(Pulse);
  });

  it("should pause and resume", async () => {
    const pulses: Pulse[] = [];
    const pulseTimes: number[] = [];
    const pulseObj = new Pulse({
      pulse: 1,
      pulses: 4,
      subdivs: 1,
      complete: 0,
      measure: 1,
      beat: 1,
      isDownBeat: true,
    });

    scheduler.onPulse((p) => {
      pulses.push(p);
      pulseTimes.push(Date.now());
    });
    let count = 0;
    scheduler.start(30, () => {
      scheduler.emitPulse(pulseObj);
      count++;
      if (count === 2) scheduler.pause();
    });

    await wait(100);
    expect(pulses.length).toBe(2);

    // Capture time between first two pulses
    const intervalBefore = pulseTimes[1] - pulseTimes[0];

    scheduler.resume(30, () => {
      scheduler.emitPulse(pulseObj);
      count++;
      if (count === 4) scheduler.stop();
    });

    await wait(100);
    expect(pulses.length).toBeGreaterThanOrEqual(4);

    // Capture time between pulses after resume
    const intervalAfter = pulseTimes[3] - pulseTimes[2];

    // The intervals before and after should be similar (within 50% margin)
    expect(intervalAfter).toBeGreaterThan(0);
    expect(intervalBefore).toBeGreaterThan(0);
    expect(intervalAfter).toBeLessThan(intervalBefore * 2);
    expect(intervalAfter).toBeGreaterThan(intervalBefore * 0.5);

    // Ensure only one timer is running (simulate by checking no double pulses)
    for (let i = 1; i < pulseTimes.length; ++i) {
      expect(pulseTimes[i] - pulseTimes[i - 1]).toBeGreaterThan(10);
    }
  });
});

describe("Metronome", () => {
  let metronome: Metronome;
  let settings: Rhythm;

  beforeEach(() => {
    settings = new Rhythm({
      bpm: 120,
      timeSignature: new TimeSignature(4, 4),
      subDivisions: quaver,
    });
    metronome = new Metronome(settings);
  });

  afterEach(() => {
    metronome.dispose();
  });

  it("should emit start, stop, pause, resume, and updated events", () => {
    const events: string[] = [];
    metronome.onEvent((e) => events.push(e));

    metronome.start();
    metronome.pause();
    metronome.resume();
    metronome.update(settings);
    metronome.stop();

    expect(events).toEqual(["start", "pause", "resume", "updated", "stop"]);
  });

  it("should emit pulses and increment measure/beat/pulse correctly", async () => {
    const pulses: Pulse[] = [];
    metronome.onPulse((p) => pulses.push(p));
    metronome.start();

    await wait(400);
    metronome.stop();

    expect(pulses.length).toBeGreaterThan(0);
    for (const pulse of pulses) {
      expect(pulse).toBeInstanceOf(Pulse);
      expect(pulse.pulse).toBeGreaterThanOrEqual(1);
      expect(pulse.pulse).toBeLessThanOrEqual(settings.pulsesPerMeasure);
      expect(pulse.measure).toBeGreaterThanOrEqual(1);
      expect(pulse.beat).toBeGreaterThanOrEqual(1);
    }
  });

  it("should allow manualPulse", async () => {
    const pulses: Pulse[] = [];
    metronome.onPulse((p) => pulses.push(p));
    await metronome.manualPulse(3);
    expect(pulses.length).toBe(3);
  });

  it("should reset counters and emit updated event on update", async () => {
    const events: string[] = [];
    metronome.onEvent((e) => events.push(e));
    const newSettings = new Rhythm({
      bpm: 60,
      timeSignature: new TimeSignature(3, 4),
      subDivisions: 1,
    });
    metronome.update(newSettings);
    expect(events).toContain("updated");
    expect(metronome.settings.bpm).toBe(60);
    expect(metronome.settings.timeSignature.upper).toBe(3);
  });

  it("should handle custom grouping and variable subdivisions", async () => {
    const customSettings = new Rhythm({
      bpm: 100,
      timeSignature: new TimeSignature(7, 8),
      subDivisions: 2,
      customGrouping: [3, 2, 2],
      variableSubDivisions: [2, 3, 2],
    });
    const m = new Metronome(customSettings);
    const pulses: Pulse[] = [];
    m.onPulse((p) => pulses.push(p));
    m.start();
    await wait(200);
    m.stop();
    expect(pulses.length).toBeGreaterThan(0);
    m.dispose();
  });
});
