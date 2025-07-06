<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Metronome } from "$lib/metronome/metronome";
    import {
        Rhythm,
        TimeSignature,
        quaver,
        quarter,
        semiquaver,
    } from "$lib/metronome";
    import { Pulse } from "$lib/metronome/pulse";

    // UI state
    let bpm = 120;
    let upper = 4;
    let lower = 4;
    // Use NoteDivision constant for default
    let subDivisions = quaver; // 2
    let customGroupingStr = "";
    let variableSubDivisionsStr = "";

    let running = false;
    let pulses: Pulse[] = [];
    let currentPulse: Pulse | null = null;
    let metronome: Metronome | null = null;

    // For visualization
    let pulseSquares: { pulse: number; isActive: boolean }[] = [];

    function parseNumberArray(str: string): number[] | undefined {
        if (!str.trim()) return undefined;
        try {
            return str
                .split(",")
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => !isNaN(n));
        } catch {
            return undefined;
        }
    }

    function createMetronome() {
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

        // Set up pulse visualization
        const totalPulses = settings.pulsesPerMeasure;
        pulseSquares = Array.from({ length: totalPulses }, (_, i) => ({
            pulse: i + 1,
            isActive: false,
        }));

        pulses = [];
        currentPulse = null;

        metronome.onPulse((p: Pulse) => {
            currentPulse = p;
            pulses = [...pulses, p];
            // Update visualization
            pulseSquares = pulseSquares.map((sq, idx) => ({
                ...sq,
                isActive: idx === p.pulse - 1,
            }));
        });
    }

    function startMetronome() {
        if (!metronome) createMetronome();
        metronome?.start();
        running = true;
    }

    function stopMetronome() {
        metronome?.stop();
        running = false;
        // Reset visualization
        pulseSquares = pulseSquares.map((sq) => ({ ...sq, isActive: false }));
        currentPulse = null;
    }

    function updateMetronome() {
        if (!metronome) {
            createMetronome();
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
        metronome.update(settings);

        // Update pulseSquares
        const totalPulses = settings.pulsesPerMeasure;
        pulseSquares = Array.from({ length: totalPulses }, (_, i) => ({
            pulse: i + 1,
            isActive: false,
        }));
        pulses = [];
        currentPulse = null;
    }

    onMount(() => {
        createMetronome();
    });

    onDestroy(() => {
        metronome?.dispose();
    });
</script>

<div class="page-center">
    <h1>Metronome Functional Test</h1>

    <div class="controls">
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
            <label for="upper">Time Signature Upper</label>
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
            <label for="lower">Time Signature Lower</label>
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
                <option value={quarter}>Quarter (1)</option>
                <option value={quaver}>Quaver/Eighth (2)</option>
                <option value={semiquaver}>Semiquaver/Sixteenth (4)</option>
            </select>
        </div>
        <div class="control-group">
            <label for="customGrouping"
                >Custom Grouping<br /><small
                    >(comma-separated, e.g. 3,2,2)</small
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
                    >(comma-separated, e.g. 2,3,2)</small
                ></label
            >
            <input
                id="variableSubDivisions"
                type="text"
                bind:value={variableSubDivisionsStr}
                on:change={updateMetronome}
            />
        </div>
        <div class="control-group">
            <button on:click={startMetronome} disabled={running}>Start</button>
            <button on:click={stopMetronome} disabled={!running}>Stop</button>
        </div>
    </div>

    <div class="pulse-row">
        {#each pulseSquares as sq, i}
            <div
                class="pulse-square {sq.isActive ? 'active' : ''}"
                title="Pulse {sq.pulse}"
            >
                {sq.pulse}
            </div>
        {/each}
    </div>

    {#if currentPulse}
        <div class="pulse-info">
            <div>
                <strong>Measure:</strong>
                {currentPulse.measure}
                &nbsp;|&nbsp;
                <strong>Beat:</strong>
                {currentPulse.beat}
                &nbsp;|&nbsp;
                <strong>Pulse:</strong>
                {currentPulse.pulse}
                &nbsp;|&nbsp;
                <strong>Subdivs:</strong>
                {currentPulse.subdivs}
                &nbsp;|&nbsp;
                <strong>isNewBeat:</strong>
                {currentPulse.isNewBeat ? "Yes" : "No"}
            </div>
        </div>
    {/if}
</div>

{#if currentPulse}
    <div class="pulse-info">
        <div>
            <strong>Measure:</strong>
            {currentPulse.measure}
            &nbsp;|&nbsp;
            <strong>Beat:</strong>
            {currentPulse.beat}
            &nbsp;|&nbsp;
            <strong>Pulse:</strong>
            {currentPulse.pulse}
            &nbsp;|&nbsp;
            <strong>Subdivs:</strong>
            {currentPulse.subdivs}
            &nbsp;|&nbsp;
            <strong>isNewBeat:</strong>
            {currentPulse.isNewBeat ? "Yes" : "No"}
        </div>
    </div>
{/if}

<style>
    .page-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        min-height: 100vh;
        padding: 4rem 2rem 2rem 2rem;
        box-sizing: border-box;
    }
    .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 2rem;
        align-items: flex-end;
        justify-content: center;
    }
    .control-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    .pulse-row {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        justify-content: center;
    }
    .pulse-square {
        width: 40px;
        height: 40px;
        background: #eee;
        border: 2px solid #bbb;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 1.2rem;
        border-radius: 6px;
        transition:
            background 0.1s,
            border 0.1s;
    }
    .pulse-square.active {
        background: #4f8cff;
        color: #fff;
        border-color: #1a5fd0;
        box-shadow: 0 0 8px #4f8cff88;
    }
    .pulse-info {
        margin-top: 1rem;
        font-size: 1rem;
        text-align: center;
    }
</style>
