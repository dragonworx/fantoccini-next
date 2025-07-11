<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PlaybackService } from './services/PlaybackService.js';
  import { formatTime } from './utils/TimelineUtils.js';
  
  export let playbackService: PlaybackService;
  export let currentTime: number = 0;
  export let duration: number = 10;
  export let framerate: number = 60;
  export let isPlaying: boolean = false;
  export let loop: boolean = false;
  export let speed: number = 1;
  export let showFrameInput: boolean = true;
  export let showSpeedControl: boolean = true;
  export let recordingEnabled: boolean = false;
  export let recordingActive: boolean = false;
  export let inMarker: number = 0;
  export let outMarker: number = 10;
  
  const dispatch = createEventDispatcher();
  
  // Reactive calculations
  $: currentFrame = Math.round(currentTime * framerate);
  $: totalFrames = Math.round(duration * framerate);
  $: progress = duration > 0 ? currentTime / duration : 0;
  $: timeDisplay = formatTime(currentTime, framerate);
  $: durationDisplay = formatTime(duration, framerate);
  
  // Input values for manual entry
  let frameInputValue = currentFrame;
  let durationInputValue = duration;
  let framerateInputValue = framerate;
  let speedInputValue = speed;
  
  // Update input values when props change
  $: frameInputValue = currentFrame;
  $: durationInputValue = duration;
  $: framerateInputValue = framerate;
  $: speedInputValue = speed;
  
  // Playback control functions
  function handlePlay() {
    if (isPlaying) {
      playbackService.pause();
    } else {
      playbackService.play();
    }
  }
  
  function handleStop() {
    playbackService.stop();
  }
  
  function handlePreviousFrame() {
    playbackService.previousFrame();
  }
  
  function handleNextFrame() {
    playbackService.nextFrame();
  }
  
  function handleSeek(event: Event) {
    const target = event.target as HTMLInputElement;
    const newTime = parseFloat(target.value);
    playbackService.seek(newTime);
  }
  
  function handleFrameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const frame = parseInt(target.value);
    if (!isNaN(frame) && frame >= 0) {
      const time = frame / framerate;
      playbackService.seek(time);
    }
  }
  
  function handleDurationInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newDuration = parseFloat(target.value);
    if (!isNaN(newDuration) && newDuration > 0) {
      playbackService.setDuration(newDuration);
      dispatch('timeline:duration', { duration: newDuration });
    }
  }
  
  function handleFramerateInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newFramerate = parseInt(target.value);
    if (!isNaN(newFramerate) && newFramerate > 0 && newFramerate <= 120) {
      playbackService.setFramerate(newFramerate);
      dispatch('timeline:framerate', { framerate: newFramerate });
    }
  }
  
  function handleSpeedInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newSpeed = parseFloat(target.value);
    if (!isNaN(newSpeed) && newSpeed > 0) {
      playbackService.setSpeed(newSpeed);
      dispatch('playback:speed', { speed: newSpeed });
    }
  }
  
  function handleLoopToggle() {
    const newLoop = !loop;
    playbackService.setLoop(newLoop);
    dispatch('timeline:loop', { loop: newLoop });
  }
  
  function handleRecordingToggle() {
    dispatch('recording:toggle', { enabled: !recordingEnabled });
  }
  
  function handleInMarkerChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newInMarker = parseFloat(target.value);
    if (!isNaN(newInMarker) && newInMarker >= 0 && newInMarker < outMarker) {
      dispatch('marker:in', { time: newInMarker });
    }
  }
  
  function handleOutMarkerChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newOutMarker = parseFloat(target.value);
    if (!isNaN(newOutMarker) && newOutMarker > inMarker && newOutMarker <= duration) {
      dispatch('marker:out', { time: newOutMarker });
    }
  }
  
  // Keyboard shortcuts
  function handleKeydown(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement) return;
    
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        handlePlay();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        handlePreviousFrame();
        break;
      case 'ArrowRight':
        event.preventDefault();
        handleNextFrame();
        break;
      case 'Home':
        event.preventDefault();
        playbackService.seek(0);
        break;
      case 'End':
        event.preventDefault();
        playbackService.seek(duration);
        break;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="timeline-controls">
  <!-- Playback Controls -->
  <div class="control-group">
    <button
      class="control-button"
      on:click={handleStop}
      title="Stop (Home)"
      aria-label="Stop playback"
    >
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect x="4" y="4" width="8" height="8" fill="currentColor" />
      </svg>
    </button>
    
    <button
      class="control-button"
      on:click={handlePreviousFrame}
      title="Previous Frame (←)"
      aria-label="Previous frame"
    >
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M6 4 L2 8 L6 12 Z M8 4 L4 8 L8 12 Z" fill="currentColor" />
      </svg>
    </button>
    
    <button
      class="control-button play-button"
      on:click={handlePlay}
      title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
      aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
    >
      {#if isPlaying}
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="4" y="3" width="3" height="10" fill="currentColor" />
          <rect x="9" y="3" width="3" height="10" fill="currentColor" />
        </svg>
      {:else}
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M4 3 L13 8 L4 13 Z" fill="currentColor" />
        </svg>
      {/if}
    </button>
    
    <button
      class="control-button"
      on:click={handleNextFrame}
      title="Next Frame (→)"
      aria-label="Next frame"
    >
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M10 4 L14 8 L10 12 Z M8 4 L12 8 L8 12 Z" fill="currentColor" />
      </svg>
    </button>
  </div>
  
  <!-- Time Display -->
  <div class="control-group">
    <div class="time-display">
      <span class="time-label">Time:</span>
      <span class="time-value">{timeDisplay}</span>
      <span class="time-separator">/</span>
      <span class="time-total">{durationDisplay}</span>
    </div>
  </div>
  
  <!-- Frame Input -->
  {#if showFrameInput}
    <div class="control-group">
      <label class="input-label">
        Frame:
        <input
          type="number"
          class="frame-input"
          bind:value={frameInputValue}
          on:change={handleFrameInput}
          min="0"
          max={totalFrames}
          step="1"
        />
        <span class="input-suffix">/ {totalFrames}</span>
      </label>
    </div>
  {/if}
  
  <!-- Seek Bar -->
  <div class="control-group seek-group">
    <input
      type="range"
      class="seek-bar"
      value={currentTime}
      min="0"
      max={duration}
      step={1 / framerate}
      on:input={handleSeek}
      aria-label="Seek timeline"
    />
    <div class="seek-markers">
      <div 
        class="seek-marker in-marker"
        style="left: {(inMarker / duration) * 100}%"
        title="In marker"
      ></div>
      <div 
        class="seek-marker out-marker"
        style="left: {(outMarker / duration) * 100}%"
        title="Out marker"
      ></div>
    </div>
  </div>
  
  <!-- Recording Controls -->
  <div class="control-group">
    <button
      class="control-button record-button"
      class:active={recordingActive}
      class:enabled={recordingEnabled}
      on:click={handleRecordingToggle}
      title="Toggle recording mode"
      aria-label="Toggle recording mode"
    >
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" fill="currentColor" />
      </svg>
    </button>
      
      <div class="marker-inputs">
        <label class="input-label">
          In:
          <input
            type="number"
            class="marker-input"
            bind:value={inMarker}
            on:change={handleInMarkerChange}
            min="0"
            max={outMarker - 0.1}
            step="0.1"
          />
        </label>
        
        <label class="input-label">
          Out:
          <input
            type="number"
            class="marker-input"
            bind:value={outMarker}
            on:change={handleOutMarkerChange}
            min={inMarker + 0.1}
            max={duration}
            step="0.1"
          />
        </label>
      </div>
    </div>
  
  <!-- Settings -->
  <div class="control-group">
    <label class="input-label">
      Duration:
      <input
        type="number"
        class="duration-input"
        bind:value={durationInputValue}
        on:change={handleDurationInput}
        min="0.1"
        max="3600"
        step="0.1"
      />
      <span class="input-suffix">s</span>
    </label>
    
    <label class="input-label">
      FPS:
      <input
        type="number"
        class="framerate-input"
        bind:value={framerateInputValue}
        on:change={handleFramerateInput}
        min="1"
        max="120"
        step="1"
      />
    </label>
    
    {#if showSpeedControl}
      <label class="input-label">
        Speed:
        <input
          type="number"
          class="speed-input"
          bind:value={speedInputValue}
          on:change={handleSpeedInput}
          min="0.1"
          max="4"
          step="0.1"
        />
        <span class="input-suffix">x</span>
      </label>
    {/if}
    
    <label class="checkbox-label">
      <input
        type="checkbox"
        checked={loop}
        on:change={handleLoopToggle}
      />
      Loop
    </label>
  </div>
</div>

<style>
  .timeline-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 16px;
    background: #1a1a1a;
    border-bottom: 1px solid #333;
    color: #ffffff;
    font-size: 12px;
    min-height: 48px;
  }
  
  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .control-button {
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    color: #ffffff;
    width: 32px;
    height: 32px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .control-button:hover {
    background: #3a3a3a;
    border-color: #4a4a4a;
  }
  
  .control-button:active {
    background: #4a4a4a;
  }
  
  .play-button {
    background: #4f8cff;
    border-color: #4f8cff;
  }
  
  .play-button:hover {
    background: #64a3ff;
    border-color: #64a3ff;
  }
  
  .record-button {
    background: #666666;
    border-color: #666666;
  }
  
  .record-button.enabled {
    background: #ff6b6b;
    border-color: #ff6b6b;
  }
  
  .record-button.enabled:hover {
    background: #ff8e8e;
    border-color: #ff8e8e;
  }
  
  .record-button.enabled.active {
    background: #ff4444;
    border-color: #ff4444;
    animation: pulse 1s infinite;
  }
  
  .record-button:hover {
    background: #777777;
    border-color: #777777;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  .time-display {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: monospace;
    font-size: 13px;
  }
  
  .time-label {
    color: #999;
  }
  
  .time-value {
    font-weight: bold;
  }
  
  .time-separator {
    color: #666;
  }
  
  .time-total {
    color: #999;
  }
  
  .seek-group {
    flex: 1;
    position: relative;
    min-width: 200px;
  }
  
  .seek-bar {
    width: 100%;
    height: 6px;
    background: #333;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    appearance: none;
  }
  
  .seek-bar::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #4f8cff;
    border-radius: 50%;
    cursor: pointer;
  }
  
  .seek-bar::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #4f8cff;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
  
  .seek-markers {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    pointer-events: none;
  }
  
  .seek-marker {
    position: absolute;
    top: 0;
    width: 2px;
    height: 100%;
    background: #ff6b6b;
    border-radius: 1px;
  }
  
  .seek-marker.in-marker {
    background: #4f8cff;
  }
  
  .seek-marker.out-marker {
    background: #ff6b6b;
  }
  
  .input-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #999;
  }
  
  .input-label input {
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    color: #ffffff;
    padding: 2px 6px;
    border-radius: 3px;
    width: 60px;
    font-size: 11px;
  }
  
  .input-label input:focus {
    outline: none;
    border-color: #4f8cff;
  }
  
  .input-suffix {
    color: #666;
    font-size: 10px;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #999;
    cursor: pointer;
  }
  
  .checkbox-label input[type="checkbox"] {
    accent-color: #4f8cff;
  }
  
  .marker-inputs {
    display: flex;
    gap: 8px;
  }
  
  .marker-input {
    width: 50px !important;
  }
  
  .frame-input,
  .duration-input,
  .framerate-input,
  .speed-input {
    width: 50px !important;
  }
</style>