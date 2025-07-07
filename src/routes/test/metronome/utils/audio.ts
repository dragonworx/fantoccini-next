// Web Audio utility for metronome pulse and measure sounds

const PULSE_VOLUME = 0.1; // 50% of previous value (was 0.2)

let audioCtx: AudioContext | null = null;
let audioInitialized = false;

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

function getAudioContext(): AudioContext | null {
  if (!isBrowser || !audioInitialized) return null;

  if (!audioCtx) {
    audioCtx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function playPulseSound({
  isNewMeasure = false,
  isDownBeat = false,
}: {
  isNewMeasure?: boolean;
  isDownBeat?: boolean;
} = {}) {
  if (!isBrowser || !audioInitialized) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Oscillator for the pulse
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Sound parameters
  let frequency = 1000; // default for off-beat
  let duration = 0.05; // seconds

  if (isNewMeasure) {
    frequency = 1760; // A6, higher pitch for new measure
    duration = 0.12;
  } else if (isDownBeat) {
    frequency = 1320; // E6, mid pitch for downbeat
    duration = 0.08;
  }

  osc.type = "square";
  osc.frequency.setValueAtTime(frequency, now);

  // Envelope for clicky sound
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(PULSE_VOLUME, now + 0.005);
  gain.gain.linearRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.01);

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

// Initialize and unlock audio context on user gesture
export function unlockAudioContext() {
  if (!isBrowser) return;

  // Mark as initialized first so getAudioContext will create the context
  audioInitialized = true;

  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx !== null;
}
