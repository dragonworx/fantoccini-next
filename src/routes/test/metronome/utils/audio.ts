/**
 * @namespace editor
 * @description Editor utilities and components for the application interface.
 * This namespace contains UI components, route handlers, and utilities
 * used in the editor interface.
 */

// Web Audio utility for metronome pulse and measure sounds

// Type declaration for browsers that might have webkitAudioContext
interface WindowWithWebkitAudio extends Window {
	webkitAudioContext?: typeof AudioContext;
}

const PULSE_VOLUME = 0.1; // 50% of previous value (was 0.2)

let audioCtx: AudioContext | null = null;
let audioInitialized = false;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

function getAudioContext(): AudioContext | null {
	if (!isBrowser || !audioInitialized) {
		return null;
	}

	if (!audioCtx) {
		const windowWithAudio = window as WindowWithWebkitAudio;
		const AudioContextConstructor = window.AudioContext || windowWithAudio.webkitAudioContext;
		if (AudioContextConstructor) {
			audioCtx = new AudioContextConstructor();
		} else {
			throw new Error('AudioContext not supported in this browser');
		}
	}
	return audioCtx;
}

/**
 * Plays a sound for metronome pulses with different tones for different beat types.
 * @memberof editor
 * @param {Object} options - Sound options
 * @param {boolean} [options.isNewMeasure=false] - Whether this is the first beat of a new measure
 * @param {boolean} [options.isDownBeat=false] - Whether this is a downbeat
 * @returns {void}
 */
export function playPulseSound({
	isNewMeasure = false,
	isDownBeat = false,
}: {
  isNewMeasure?: boolean;
  isDownBeat?: boolean;
} = {}): void {
	if (!isBrowser || !audioInitialized) {
		return;
	}

	const ctx = getAudioContext();
	if (!ctx) {
		return;
	}

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

	osc.type = 'square';
	osc.frequency.setValueAtTime(frequency, now);

	// Envelope for clicky sound
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.linearRampToValueAtTime(PULSE_VOLUME, now + 0.005);
	gain.gain.linearRampToValueAtTime(0.0001, now + duration);

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.start(now);
	osc.stop(now + duration + 0.01);

	osc.onended = (): void => {
		osc.disconnect();
		gain.disconnect();
	};
}

/**
 * Initialize and unlock audio context on user gesture.
 * Must be called after a user interaction to enable audio in browsers.
 * @memberof editor
 * @returns {boolean|undefined} True if audio context was successfully created, undefined if not in browser
 */
export function unlockAudioContext(): boolean | undefined {
	if (!isBrowser) {
		return;
	}

	// Mark as initialized first so getAudioContext will create the context
	audioInitialized = true;

	const ctx = getAudioContext();
	if (ctx && ctx.state === 'suspended') {
		ctx.resume();
	}
	return ctx !== null;
}
