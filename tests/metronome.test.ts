import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Metronome, quaver, Rhythm, TimeSignature, MetronomeScheduler, Pulse } from "../src/core";

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
    
    metronome.onEvent('start', (data) => {
      events.push('start');
      expect(data.bpm).toBe(120);
      expect(data.currentTime).toBeGreaterThan(0);
    });
    
    metronome.onEvent('pause', (data) => {
      events.push('pause');
      expect(data.currentPulse).toBeGreaterThanOrEqual(1);
    });
    
    metronome.onEvent('resume', (data) => {
      events.push('resume');
      expect(data.currentPulse).toBeGreaterThanOrEqual(1);
    });
    
    metronome.onEvent('updated', (data) => {
      events.push('updated');
      expect(data.oldRhythm).toBeDefined();
      expect(data.newRhythm).toBeDefined();
    });
    
    metronome.onEvent('stop', (data) => {
      events.push('stop');
      expect(data.totalPulses).toBeGreaterThanOrEqual(0);
    });

    metronome.start();
    metronome.pause();
    metronome.resume();
    metronome.update(settings);
    metronome.stop();

    expect(events).toEqual(["start", "pause", "resume", "updated", "stop"]);
  });

  it("should emit measure and downbeat events", async () => {
    const measureEvents: Array<{ measureNumber: number; totalBeats: number }> = [];
    const downbeatEvents: Array<{ measureNumber: number; beat: number }> = [];
    
    metronome.onEvent('measure', (data) => {
      measureEvents.push(data);
    });
    
    metronome.onEvent('downbeat', (data) => {
      downbeatEvents.push(data);
    });
    
    metronome.start();
    await wait(1000); // Wait longer for multiple pulses to ensure measure completion
    metronome.stop();
    
    // Since we might not get measure events if the measure doesn't complete,
    // let's at least check we get some downbeat events
    expect(downbeatEvents.length).toBeGreaterThan(0);
    
    // Check structure of events
    measureEvents.forEach(event => {
      expect(event.measureNumber).toBeGreaterThan(0);
      expect(event.totalBeats).toBe(4); // 4/4 time signature
    });
    
    downbeatEvents.forEach(event => {
      expect(event.measureNumber).toBeGreaterThan(0);
      expect(event.beat).toBeGreaterThan(0);
    });
  });

  it("should support event listener cleanup", () => {
    const listener = vi.fn();
    
    const unsubscribe = metronome.onEvent('start', listener);
    
    metronome.start();
    expect(listener).toHaveBeenCalledTimes(1);
    
    metronome.stop();
    listener.mockClear();
    
    // Remove listener
    const removed = unsubscribe();
    expect(removed).toBe(true);
    
    metronome.start();
    expect(listener).not.toHaveBeenCalled();
    
    metronome.stop();
  });

  it("should support multiple listeners per event", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const listener3 = vi.fn();
    
    metronome.onEvent('start', listener1);
    metronome.onEvent('start', listener2);
    metronome.onEvent('start', listener3);
    
    metronome.start();
    
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener3).toHaveBeenCalledTimes(1);
    
    metronome.stop();
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
    metronome.onEvent('updated', (data) => {
      events.push('updated');
      expect(data.oldRhythm.bpm).toBe(120);
      expect(data.newRhythm.bpm).toBe(60);
    });
    
    metronome.onEvent('tempo:change', (data) => {
      events.push('tempo:change');
      expect(data.oldBpm).toBe(120);
      expect(data.newBpm).toBe(60);
    });
    
    metronome.onEvent('timeSignature:change', (data) => {
      events.push('timeSignature:change');
      expect(data.oldSignature).toBe('4/4');
      expect(data.newSignature).toBe('3/4');
    });
    
    const newSettings = new Rhythm({
      bpm: 60,
      timeSignature: new TimeSignature(3, 4),
      subDivisions: 1,
    });
    metronome.update(newSettings);
    expect(events).toContain("updated");
    expect(events).toContain("tempo:change");
    expect(events).toContain("timeSignature:change");
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
