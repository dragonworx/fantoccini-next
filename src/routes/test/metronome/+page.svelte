<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Metronome,
		Rhythm,
		TimeSignature,
		Pulse,
		quaver,
		quarter,
		semiquaver
	} from '$core';
	import LaunchAudioDialog from '$lib/components/LaunchAudioDialog.svelte';
	import { browser } from '$app/environment';
	import { playPulseSound, unlockAudioContext } from './utils/audio';
	import DialProgress from '$lib/components/DialProgress.svelte';

	// For true measure-based dial progress
	let measureProgress = 0; // 0.0 - 1.0
	let measureStartTime = 0;
	let measureDuration = 0;
	let animationFrameId: number | null = null;

	// Returns an array of progress values (0 to 1) for each subdivision dial
    // Persistent array to track isDownBeat for each dial in the current measure
	let dialMeta: { isDownBeat: boolean }[] = [];

	// Reactive variable to ensure dials update when measureProgress changes
	$: dialValues = (() => {
		// Include measureProgress in the reactive dependencies
		measureProgress;
		return getDialValues(currentPulse, subDivisions);
	})();

	function resetDialMeta(subDivisions: number) {
		dialMeta = [];
		for (let i = 0; i < subDivisions; i++) {
			dialMeta.push({
				isDownBeat: i === 0 || i % subDivisions === 0,
			});
		}
	}

	function getDialValues(
		currentPulse: Pulse | null,
		subDivisions: number,
	): { value: number; isDownBeat: boolean }[] {
		// Use currentPulse.subdivs for dial count if available, else fallback to UI subDivisions
		const usedSubdivs = currentPulse?.subdivs ?? subDivisions;
		const dialCount = usedSubdivs;
		if (dialMeta.length !== dialCount) {
			resetDialMeta(dialCount);
		}
		if (dialCount < 1) return [];
		const values: { value: number; isDownBeat: boolean }[] = [];
		if (!currentPulse) {
			// Show all dials as empty until first pulse
			for (let i = 0; i < dialCount; i++)
				values.push({
					value: 0,
					isDownBeat: dialMeta[i]?.isDownBeat ?? false,
				});
			return values;
		}
		// If the measure is complete (measureProgress is 1 or more), all dials should be full.
		if (measureProgress >= 1) {
			for (let i = 0; i < dialCount; i++)
				values.push({
					value: 1,
					isDownBeat: dialMeta[i]?.isDownBeat ?? false,
				});
			return values;
		}
		// measureProgress: 0..1 for the whole measure
    	// Find which dial is active
		const totalProgress = measureProgress * dialCount;
		// Add EPSILON to handle floating point inaccuracies near integer boundaries
		const activeDialIndex = Math.floor(totalProgress + Number.EPSILON);
		let progressWithinSubdivision = totalProgress - activeDialIndex;

		// Apply snapping for visual consistency at boundaries
		const EPSILON = 0.05; // Increased threshold to ensure dials snap to 1 (full) more visibly at segment end
		if (progressWithinSubdivision >= 1 - EPSILON) {
			progressWithinSubdivision = 1; // Snap to 1 if very close to end
		} else if (progressWithinSubdivision <= EPSILON && totalProgress > 0) {
			// Only snap to 0 if progress has actually started, to avoid initial partial fill
			progressWithinSubdivision = 0; // Snap to 0 if very close to start
		}

		for (let i = 0; i < dialCount; i++) {
			if (i < activeDialIndex) {
				values.push({
					value: 1,
					isDownBeat: dialMeta[i]?.isDownBeat ?? false,
				});
			} else if (i === activeDialIndex) {
				values.push({
					value: progressWithinSubdivision,
					isDownBeat: dialMeta[i]?.isDownBeat ?? false,
				});
			} else {
				values.push({
					value: 0,
					isDownBeat: dialMeta[i]?.isDownBeat ?? false,
				});
			}
		}
		return values;
	}

	// UI state
	let bpm = 60;
	let upper = 4;
	let lower = 4;
	// Use NoteDivision constant for default
	let subDivisions = quaver; // 2
	let customGroupingStr = '';
	let variableSubDivisionsStr = '';
	let audioOn = true;
	let audioContextInitialized = false;

	// Only run the reactive statement when both conditions are met and audio context isn't already initialized
	$: {
		if (audioOn && browser && audioContextInitialized) {
			unlockAudioContext();
		}
	}

	// Frame rate presets
	const frameRatePresets = [
		{
			label: '1 fps',
			bpm: 60,
			upper: 1,
			lower: 4,
			subDivisions: 1,
		},
		{
			label: '2 fps',
			bpm: 120,
			upper: 2,
			lower: 4,
			subDivisions: 1,
		},
		{
			label: '4 fps',
			bpm: 240,
			upper: 4,
			lower: 4,
			subDivisions: 1,
		},
		{
			label: '8 fps',
			bpm: 480,
			upper: 8,
			lower: 4,
			subDivisions: 1,
		},
		{
			label: '12 fps',
			bpm: 720,
			upper: 12,
			lower: 4,
			subDivisions: 1,
		},
		{
			label: '24 fps (Film)',
			bpm: 1440,
			upper: 24,
			lower: 4,
			subDivisions: 1, // Each pulse is a frame
		},
		{
			label: '25 fps (PAL/Video)',
			bpm: 1500,
			upper: 25,
			lower: 4,
			subDivisions: 1, // Each pulse is a frame
		},
		{
			label: '30 fps (NTSC/Video)',
			bpm: 1800,
			upper: 30,
			lower: 4,
			subDivisions: 1, // Each pulse is a frame
		},
		{
			label: '48 fps (High Frame Rate)',
			bpm: 2880,
			upper: 48,
			lower: 4,
			subDivisions: 1, // Each pulse is a frame
		},
		{
			label: '50 fps (PAL Double)',
			bpm: 3000,
			upper: 50,
			lower: 4,
			subDivisions: 1, // Each pulse is a frame
		},
		{
			label: '60 fps (NTSC Double)',
			bpm: 3600,
			upper: 60,
			lower: 4,
			subDivisions: 1, // Each pulse is a frame
		},
	];

	/**
     * FrameRatePreset type for TypeScript
     * (placed outside <script> for Svelte compatibility)
     */
    // @ts-ignore


    /**
     * @param {{label: string, bpm: number, upper: number, lower: number, subDivisions: number}} preset
     */
	function selectPreset(preset: any) {
		// Stop and dispose previous metronome if running
		if (metronome) {
			metronome.stop();
			metronome.dispose();
			metronome = null;
		}
		bpm = preset.bpm;
		upper = preset.upper;
		lower = preset.lower;
		subDivisions = preset.subDivisions;
		customGroupingStr = '';
		variableSubDivisionsStr = '';
		createMetronome();
		running = true;
		paused = false;
		metronome!.start();
	}

	function handlePresetChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		if (target && target.selectedIndex > 0) {
			selectPreset(frameRatePresets[target.selectedIndex - 1]);
		}
	}

	let running = false;
	let paused = false;
	let pulses: Pulse[] = [];
	let currentPulse: Pulse | null = null;
	let metronome: Metronome | null = null;

	// For visualization
	let pulseSquares: {
		pulse: number;
		colorClass: string;
		lit: boolean;
		fading: boolean;
	}[] = [];

	function parseNumberArray(str: string): number[] | undefined {
		if (!str.trim()) return undefined;
		try {
			return str
				.split(',')
				.map((s) => parseInt(s.trim(), 10))
				.filter((n) => !isNaN(n));
		} catch {
			return undefined;
		}
	}

	function createMetronome() {
		// Return early if we're not in browser environment or audio context not initialized
		if (!browser || !audioContextInitialized) return;

		const customGrouping = parseNumberArray(customGroupingStr);
		const variableSubDivisions = parseNumberArray(variableSubDivisionsStr);

		const settings = new Rhythm({
			bpm,
			timeSignature: new TimeSignature(upper, lower),
			subDivisions,
			customGrouping:
				customGrouping && customGrouping.length > 0
					? customGrouping
					: undefined,
			variableSubDivisions:
				variableSubDivisions && variableSubDivisions.length > 0
					? variableSubDivisions
					: undefined,
		});

		if (metronome) {
			metronome.dispose();
		}
		metronome = new Metronome(settings);

		// Set up pulseSquares for the measure
		const totalPulses = settings.pulsesPerMeasure;
		pulseSquares = Array.from({ length: totalPulses }, (_, i) => ({
			pulse: i + 1,
			colorClass: '',
			lit: false,
			fading: false,
		}));
		currentPulse = null;

		// Reset dialMeta for the new measure
		resetDialMeta(settings.subDivisions);

		function lightUpPulse(idx: number, colorClass: string) {
			// Defensive: only update if idx is in bounds
			if (!pulseSquares[idx]) return;
			pulseSquares[idx].colorClass = colorClass;
			pulseSquares[idx].lit = true;
			pulseSquares[idx].fading = false;
			pulseSquares = [...pulseSquares]; // trigger reactivity

			setTimeout(() => {
				if (!pulseSquares[idx]) return;
				pulseSquares[idx].lit = false;
				pulseSquares[idx].fading = true;
				pulseSquares = [...pulseSquares];
				setTimeout(() => {
					if (!pulseSquares[idx]) return;
					pulseSquares[idx].colorClass = '';
					pulseSquares[idx].fading = false;
					pulseSquares = [...pulseSquares];
				}, 100);
			}, 180);
		}

		metronome.onPulse((p: Pulse) => {
			currentPulse = p;
			pulses = [...pulses, p];
			let colorClass = 'white';
			if (p.pulse === 1 && p.beat === 1) colorClass = 'green';
			else if (p.isDownBeat) colorClass = 'blue';
			lightUpPulse(p.pulse - 1, colorClass);

			// Play sound for this pulse if audio is enabled, in browser, and audio context is initialized
			if (audioOn && browser && audioContextInitialized) {
				try {
					playPulseSound({
						isNewMeasure: p.pulse === 1 && p.beat === 1,
						isDownBeat: p.isDownBeat,
					});
				} catch (e) {
					console.error('Audio playback failed:', e);
					// Try unlocking the audio context if there's an error
					unlockAudioContext();
				}
			}

			// --- True measure-based dial progress timing ---
    		// Duration of a measure in ms: beats per measure * ms per beat
			measureDuration = (60000 / bpm) * upper;
			measureStartTime = performance.now();
			measureProgress = 0;
			// Reset dialMeta at the start of each measure
			resetDialMeta(p.subdivs || settings.subDivisions);

			// Use the animationFrameId to request animation instead of calling animateProgress
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			animationFrameId = requestAnimationFrame(function animateFrame() {
				if (!running || !currentPulse) return;
				const now = performance.now();
				if (measureDuration > 0) {
					// Use pulse index as "current" instead of "previous" for base progress
    				// This fixes the lag by a segment
					const base = currentPulse.pulse / currentPulse.pulses;
					// Interpolate between previous and current pulse's complete value
    				// but anchor to the "current" pulse position
					measureProgress = Math.min(
						1,
						Math.max(
							0,
							(now - measureStartTime) / measureDuration,
							base,
						),
					);
					// Force update to trigger reactivity
					// eslint-disable-next-line no-self-assign
					measureProgress = measureProgress;
				} else {
					measureProgress = currentPulse.complete;
				}
				animationFrameId = requestAnimationFrame(animateFrame);
			});
		});

		metronome.onEvent((event: string) => {
			if (event === 'stop') {
				measureProgress = 0;
				currentPulse = null;
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
					animationFrameId = null;
				}
			}
		});
	}

	function toggleMetronome() {
		if (running) {
			metronome?.stop();
			running = false;
			paused = false;
			// Reset visualization
			pulseSquares = pulseSquares.map((sq) => ({
				...sq,
				colorClass: '',
				lit: false,
				fading: false,
			}));
			currentPulse = null;
		} else {
			createMetronome(); // Always create a new instance to ensure fresh audio state
			metronome?.start();
			running = true;
			paused = false;
		}
	}

	function pauseMetronome() {
		if (!browser) return;

		if (running && !paused) {
			metronome?.pause();
			paused = true;
		}
	}

	function resumeMetronome() {
		if (!browser) return;

		if (running && paused) {
			metronome?.resume();
			paused = false;
		}
	}

	function updateMetronome() {
		// Check for browser environment, initialized audio context, and metronome
		if (!browser || !audioContextInitialized || !metronome) {
			return;
		}
		const customGrouping = parseNumberArray(customGroupingStr);
		const variableSubDivisions = parseNumberArray(variableSubDivisionsStr);

		const settings = new Rhythm({
			bpm,
			timeSignature: new TimeSignature(upper, lower),
			subDivisions,
			customGrouping:
				customGrouping && customGrouping.length > 0
					? customGrouping
					: undefined,
			variableSubDivisions:
				variableSubDivisions && variableSubDivisions.length > 0
					? variableSubDivisions
					: undefined,
		});

		if (running) {
			metronome.update(settings);
			pulses = [];
			currentPulse = null;
		} else {
			// If not running, just update the settings for next start
			metronome.dispose();
			metronome = new Metronome(settings);
		}

		// Always update pulseSquares when subdivisions change
		const totalPulses = settings.pulsesPerMeasure;
		pulseSquares = Array.from({ length: totalPulses }, (_, i) => ({
			pulse: i + 1,
			colorClass: '',
			lit: false,
			fading: false,
		}));

		// Reset dialMeta to match current subdivision count
		resetDialMeta(subDivisions);
	}

	onMount(() => {
		// Browser environment check
		if (!browser) return;

		// We'll set up event listeners, but won't initialize audio context yet
    	// The audio context will be initialized when the user clicks the Launch button
		const unlock = () => {
			if (audioContextInitialized) {
				unlockAudioContext();
				window.removeEventListener('pointerdown', unlock);
				window.removeEventListener('keydown', unlock);
			}
		};

		window.addEventListener('pointerdown', unlock);
		window.addEventListener('keydown', unlock);

		// Don't create metronome here - wait for dialog dismissal

    	// Animation loop for true measure-based dial progress
		function _animateProgress() {
			if (!running || !currentPulse) return;
			const now = performance.now();
			if (measureDuration > 0) {
				// Use pulse index as "current" instead of "previous" for base progress
    			// This fixes the lag by a segment
				const base = currentPulse.pulse / currentPulse.pulses;
				// Calculate progress based on elapsed time
				measureProgress = Math.min(
					1,
					Math.max(
						0,
						(now - measureStartTime) / measureDuration,
						base,
					),
				);
			} else {
				measureProgress = currentPulse.complete;
			}
			// Force Svelte to update by assigning the value
			// eslint-disable-next-line no-self-assign
			measureProgress = measureProgress;
			animationFrameId = requestAnimationFrame(_animateProgress);
		}
	});

	onDestroy(() => {
		if (browser && metronome) {
			metronome.dispose();
		}
	});

	// Handle audio context initialization when the dialog is dismissed
	function handleAudioLaunch() {
		if (browser) {
			audioContextInitialized = true;
			unlockAudioContext();
			createMetronome(); // Create metronome only after audio context is ready
		}
	}
</script>

<LaunchAudioDialog onLaunch={handleAudioLaunch} />

<div class="page-center dark">
	<h1>Metronome</h1>

	<div class="controls-grid" style="flex: 1 0 auto;">
		<div class="row">
			<div class="control-group">
				<label for="preset">Frame Rate Presets</label>
				<select id="preset" on:change={(e) => handlePresetChange(e)}>
					<option value="">-- Select a preset --</option>
					{#each frameRatePresets as preset}
						<option value={preset.label}>{preset.label}</option>
					{/each}
				</select>
			</div>
			<div class="control-group checkbox-group">
				<label for="audioOn" class="checkbox-label">
					<input
						id="audioOn"
						type="checkbox"
						bind:checked={audioOn}
						on:change={updateMetronome}
					/>
					Audio
				</label>
			</div>
		</div>
		<div class="row">
			<div class="control-group">
				<label for="bpm">Tempo (BPM)</label>
				<input
					id="bpm"
					type="number"
					min="20"
					max="400"
					bind:value={bpm}
					on:change={updateMetronome}
				/>
			</div>
			<div class="control-group">
				<label for="upper">Time Sig. Upper</label>
				<input
					id="upper"
					type="number"
					min="1"
					max="32"
					bind:value={upper}
					on:change={updateMetronome}
				/>
			</div>
			<div class="control-group">
				<label for="lower">Time Sig. Lower</label>
				<input
					id="lower"
					type="number"
					min="1"
					max="32"
					step="1"
					bind:value={lower}
					on:change={updateMetronome}
				/>
			</div>
			<div class="control-group">
				<label for="subDivisions">Subdivisions</label>
				<select
					id="subDivisions"
					bind:value={subDivisions}
					on:change={updateMetronome}
				>
					<option value={quarter}>Quarter ({quarter})</option>
					<option value={quaver}>Quaver ({quaver})</option>
					<option value={semiquaver}>Semiquaver ({semiquaver})</option
					>
					<option value={8}>Thirty-second (8)</option>
					<option value={16}>Sixty-fourth (16)</option>
				</select>
			</div>
		</div>
		<div class="row">
			<div class="control-group">
				<label for="customGrouping"
				>Custom Grouping<br /><small>(comma, e.g. 3,2,2)</small
				></label
				>
				<input
					id="customGrouping"
					type="text"
					bind:value={customGroupingStr}
					on:change={updateMetronome}
				/>
			</div>
			<div class="control-group">
				<label for="variableSubDivisions"
				>Variable Subdivisions<br /><small
				>(comma, e.g. 2,3,2)</small
				></label
				>
				<input
					id="variableSubDivisions"
					type="text"
					bind:value={variableSubDivisionsStr}
					on:change={updateMetronome}
				/>
			</div>
		</div>
		<!-- Button controls -->
		<div class="button-row">
			<div class="button-group">
				<button class="main-btn" on:click={toggleMetronome}>
					{running ? 'Stop' : 'Start'}
				</button>
				<button
					class="main-btn"
					on:click={paused ? resumeMetronome : pauseMetronome}
					disabled={!running}
				>
					{paused ? 'Resume' : 'Pause'}
				</button>
			</div>
		</div>
	</div>

	<div class="pulse-row">
		{#each pulseSquares as sq, _i}
			<div
				class="pulse-square {sq.colorClass} {sq.lit
					? 'lit'
					: ''} {sq.fading ? 'fading' : ''}"
				title="Pulse {sq.pulse}"
			>
				{sq.pulse}
			</div>
		{/each}
	</div>

	<!-- Dial row moved to below pulse row -->
	<div
		class="dial-row"
		style="display: flex; justify-content: center; gap: 1.5em; margin: 1.2em 0;"
	>
		{#each dialValues as dial, i (i)}
			<DialProgress
				min={0}
				max={1}
				currentValue={dial.value}
				size={48}
				color={dial.value >= 1 ? '#1ed760' : '#fff'}
			/>
		{/each}
	</div>

	{#if currentPulse}
		<div class="pulse-info">
			<div>
				<strong>Measure:</strong>
				<span class="fixed-num">{currentPulse?.measure}</span>
				&nbsp;|&nbsp;
				<strong>Beat:</strong>
				<span class="fixed-num">{currentPulse?.beat}</span>
				&nbsp;|&nbsp;
				<strong>Pulse:</strong>
				<span class="fixed-num">{currentPulse?.pulse}</span>
				&nbsp;|&nbsp;
				<strong>Subdivs:</strong>
				<span class="fixed-num">{currentPulse?.subdivs}</span>
				&nbsp;|&nbsp;
				<strong>isDownBeat:</strong>
				<span class="fixed-yesno"
				>{currentPulse?.isDownBeat ? 'Yes' : 'No'}</span
				>
			</div>
		</div>
	{/if}
</div>

<style>
    :root {
        --pulse-green: #1ed760;
        --pulse-blue: #4f8cff;
    }

    .dark {
        color: #e3e9f3;
    }
    .page-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        width: 100vw;
        max-width: 100vw;
        box-sizing: border-box;
        overflow-x: hidden;
    }
    .controls-grid {
        display: grid;
        grid-template-rows: repeat(3, auto);
        gap: 1.2rem 0;
        margin-bottom: 2rem;
        align-items: center;
        justify-items: center;
        width: 100%;
        max-width: 900px;
        background: #23283a;
        border-radius: 18px;
        box-shadow: 0 2px 24px #000a 0.5;
        padding: 2rem 2vw 1.5rem 2vw;
        box-sizing: border-box;
        overflow-x: auto;
    }
    .info-bar {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 3.5rem; /* Adjust if your footer is taller/shorter */
        z-index: 100;
        background: #23283a;
        color: #8ca0b3;
        text-align: center;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border-radius: 8px 8px 0 0;
        box-shadow: 0 -2px 12px #000a;
        pointer-events: none;
        transition: opacity 0.2s;
    }
    .row {
        display: flex;
        flex-direction: row;
        gap: 2.2rem;
        width: 100%;
        justify-content: center;
        align-items: flex-end;
    }
    .control-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 120px;
        max-width: 200px;
    }
    .checkbox-group {
        min-width: 110px;
        max-width: 140px;
        align-items: flex-start;
        margin-top: 1.2rem;
    }
    .button-group {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 0.5rem;
        min-width: 220px;
    }
    .main-btn,
    .main-btn:disabled {
        background: linear-gradient(90deg, #4f8cff 60%, #1a5fd0 100%);
        color: #fff;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        font-size: 1.1rem;
        padding: 0.5rem 1.3rem;
        min-width: 110px;
        box-shadow: 0 2px 8px #4f8cff22;
        transition:
            background 0.15s,
            box-shadow 0.15s;
        cursor: pointer;
        box-sizing: border-box;
    }
    .main-btn:disabled {
        background: #3a4660;
        color: #fff;
        cursor: not-allowed;
    }
    .button-group button:not(.main-btn),
    .button-group button:not(.main-btn):disabled {
        background: #23283a;
        color: #b3c6e0;
        border: 1px solid #3a4660;
        border-radius: 8px;
        font-weight: 500;
        font-size: 1rem;
        padding: 0.5rem 1.1rem;
        min-width: 90px;
        transition:
            background 0.15s,
            border 0.15s;
        cursor: pointer;
        box-sizing: border-box;
    }
    .button-group button:not(.main-btn):disabled {
        color: #3a4660;
        cursor: not-allowed;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        font-size: 1rem;
        margin-top: 0.2rem;
        color: #e3e9f3;
    }
    .control-group label {
        font-weight: 500;
        font-size: 1rem;
        margin-bottom: 0.1rem;
        color: #e3e9f3;
    }
    .control-group input[type="number"],
    .control-group input[type="text"],
    .control-group select {
        padding: 0.18rem 0.5rem;
        border-radius: 5px;
        border: 1px solid #3a4660;
        font-size: 0.85rem;
        background: #2d3344;
        color: #181c24;
        transition:
            border 0.15s,
            background 0.15s;
        width: 100%;
        box-sizing: border-box;
    }
    .control-group input[type="number"] {
        max-width: 70px;
        min-width: 0;
        background: #e3e9f3;
        color: #181c24;
    }
    .control-group input[type="text"] {
        background: #e3e9f3;
        color: #181c24;
    }
    .control-group select {
        background: #e3e9f3;
        color: #181c24;
    }
    .control-group input[type="number"]:focus,
    .control-group input[type="text"]:focus,
    .control-group select:focus {
        outline: none;
        border: 1.5px solid #4f8cff;
        background: #fff;
        color: #181c24;
    }

    /* Style for dropdowns and text/numeric inputs */
    input[type="number"],
    input[type="text"],
    select {
        background: #23283a;
        color: #e6eaf3;
        border: 1px solid red;
        border-radius: 6px;
        padding: 0.35em 0.7em;
        transition:
            background 0.2s,
            color 0.2s,
            border 0.2s;
    }
    input[type="number"]:focus,
    input[type="text"]:focus,
    select:focus {
        background: #181c24;
        color: #fff;
        border-color: #4075a6;
    }
    /* Style for labels to contrast with input backgrounds */
    .control-group label,
    .checkbox-label {
        color: #e6eaf3;
        background: #23283a;
        padding: 0.1em 0.4em;
        border-radius: 4px;
        font-weight: 500;
        margin-bottom: 0.2em;
        display: inline-block;
    }

    .pulse-row {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.2rem;
        justify-content: center;
        flex-wrap: wrap;
        max-width: 900px;
    }
    .pulse-square {
        width: 38px;
        height: 38px;
        background: transparent;
        border: 2px solid #3a4660;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 1.18rem;
        border-radius: 8px;
        box-shadow: 0 1px 4px #000a 0.2;
        margin-bottom: 2px;
        color: #b3c6e0;
        opacity: 1;
        transition:
            background 0.1s cubic-bezier(0.4, 0, 0.2, 1),
            border 0.1s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1),
            color 0.1s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.1s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Fade in */
    .pulse-square.lit.white {
        background: linear-gradient(90deg, #fff 60%, #e3e9f3 100%);
        border-color: #b3c6e0;
        color: #23283a;
        box-shadow: 0 0 16px #fff8;
        transition:
            background 0.1s,
            color 0.1s,
            border-color 0.1s;
    }
    .pulse-square.lit.green {
        background: linear-gradient(90deg, #1ed760 60%, #13b44a 100%);
        border-color: #13b44a;
        color: #fff;
        box-shadow: 0 0 20px #1ed760cc;
        transition:
            background 0.1s,
            color 0.1s,
            border-color 0.1s;
    }
    .pulse-square.lit.blue {
        background: linear-gradient(90deg, #4f8cff 60%, #1a5fd0 100%);
        border-color: #1a5fd0;
        color: #fff;
        box-shadow: 0 0 16px #4f8cff88;
        transition:
            background 0.1s,
            color 0.1s,
            border-color 0.1s;
    }

    /* Fade out */
    .pulse-square.fading {
        transition:
            background 1s,
            color 0.1s,
            border-color 0.1s;
        background: transparent !important;
        color: #b3c6e0 !important;
        border-color: #3a4660 !important;
        box-shadow: 0 1px 4px #000a 0.2;
    }
    .pulse-info {
        margin-top: 1.2rem;
        font-size: 1.08rem;
        text-align: center;
        background: #23283a;
        border-radius: 8px;
        padding: 0.7rem 1.2rem;
        box-shadow: 0 1px 6px #000a 0.2;
        display: inline-block;
    }
    .pulse-info strong {
        color: #8ca0b3;
    }
    .pulse-info .fixed-num {
        display: inline-block;
        min-width: 2ch;
        font-family: "Menlo", "Consolas", "Liberation Mono", monospace;
        text-align: right;
        color: #fff;
    }
    .pulse-info .fixed-yesno {
        display: inline-block;
        min-width: 3ch;
        font-family: "Menlo", "Consolas", "Liberation Mono", monospace;
        text-align: left;
        color: #fff;
    }
    @media (max-width: 1100px) {
        .controls-grid {
            max-width: 99vw;
            padding: 1.2rem 0.5rem 1rem 0.5rem;
        }
        .row {
            gap: 1.1rem;
        }
    }
    @media (max-width: 1100px) {
        .controls-grid {
            padding: 1.2rem 1vw 1rem 1vw;
            max-width: 98vw;
        }
        .row {
            flex-direction: column;
            gap: 0.7rem;
            align-items: stretch;
        }
        .control-group {
            min-width: 0;
            max-width: 100vw;
        }
        .button-group {
            min-width: 0;
            justify-content: stretch;
        }
    }
    @media (max-width: 700px) {
        .controls-grid {
            padding: 0.7rem 0.5vw 0.7rem 0.5vw;
            max-width: 100vw;
        }
        .row {
            flex-direction: column;
            gap: 0.5rem;
        }
        .control-group {
            min-width: 0;
            max-width: 100vw;
        }
        .button-group {
            min-width: 0;
            justify-content: stretch;
        }
    }
</style>
