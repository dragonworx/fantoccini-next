<script lang="ts">
    import { onMount } from 'svelte';
    let dialogEl: HTMLDialogElement | null = null;
    let launched = false;

    // Expose a way for parent to know if launched, if needed
    export let onLaunch: () => void = () => {};

    // Show dialog on mount if not launched
    onMount(() => {
    	if (!launched && dialogEl) {
    		dialogEl.showModal();
    	}
    });

    function handleLaunch() {
    	launched = true;
    	if (dialogEl) dialogEl.close();
    	if (onLaunch) onLaunch();
    }
</script>

<dialog
    bind:this={dialogEl}
    aria-modal="true"
    style="padding: 2rem; border-radius: 1rem; min-width: 240px;"
>
    <form
        method="dialog"
        style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem;"
    >
        <h2>Enable Audio</h2>
        <p>
            To start the metronome, please launch the audio context.<br />
            This is required by your browser for sound playback.
        </p>
        <!-- svelte-ignore a11y-autofocus -->
        <button
            type="button"
            class="launch-btn"
            on:click={handleLaunch}
            autofocus
        >
            Launch
        </button>
    </form>
</dialog>

<style>
    dialog {
        border: none;
        background: #232b2b;
        color: #e0ffe0;
        box-shadow:
            0 4px 32px #000a,
            0 1.5px 0 #4be06b inset;
        font-family: inherit;
    }
    .launch-btn {
        padding: 0.75em 2em;
        font-size: 1.15em;
        background: #4be06b;
        color: #184c32;
        border: none;
        border-radius: 0.5em;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s;
    }
    .launch-btn:hover,
    .launch-btn:focus {
        background: #2fdc5a;
        outline: 2px solid #184c32;
    }
</style>
