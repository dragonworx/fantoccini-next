<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Timeline } from '../../../core/timeline/index.js';
	import { Sprite } from '../../../core/object/sprite.js';
	import { Scene } from '../../../core/object/scene.js';
	import { Metronome, Rhythm, TimeSignature } from '../../../core/metronome/index.js';
	import TimelineContainer from '../../../lib/components/timeline/TimelineContainer.svelte';
	import RotationDial from '../../../lib/components/controls/RotationDial.svelte';
	import { KeyframeOptimizer } from '../../../lib/components/keyframe-optimizer/KeyframeOptimizer.js';
	import { AnimatableObject } from '../../../lib/components/animation/AnimatableObject.js';
	import type { TimelineConfig } from '../../../lib/components/timeline/types/TimelineTypes.js';
	import type { IClip } from '../../../lib/components/animation/types/ClipTypes.js';

	// Demo configuration
	let canvasElement: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let animationFrameId: number | undefined;

	// Core objects
	let timeline: Timeline;
	let metronome: Metronome;
	let scene: Scene;
	let sprite: Sprite;
	let keyframeOptimizer: KeyframeOptimizer;
	let animatableObject: AnimatableObject;

	// Timeline configuration
	let timelineConfig: TimelineConfig;

	// Demo state
	let isInitialized = false;
	const state = { isPlaying: false };
	const canvasWidth = 600;
	const canvasHeight = 400;
	const backgroundColor = '#1a1a1a';

	// User controls
	let spriteName = 'Demo Sprite';
	let spriteSize = 50;
	let spriteColor = '#4f8cff';
	let spriteBorderWidth = 2;
	let spriteBorderColor = '#ffffff';
	let spriteX = 300;
	let spriteY = 200;
	let spriteRotation = 0;
	let spriteScaleX = 1;
	let spriteAlpha = 1;
	let timelineDuration = 10;
	let timelineFramerate = 60;
	let timelineLoop = true;
	let recordingEnabled = true;
	let inMarker = 2;
	let outMarker = 8;

	onMount(() => {
		initializeDemo();
	});

	onDestroy(() => {
		cleanup();
	});

	function initializeDemo() {
		if (!canvasElement) return;

		// Initialize canvas
		ctx = canvasElement.getContext('2d')!;

		// Create timeline
		timeline = new Timeline({
			duration: timelineDuration,
			framerate: timelineFramerate,
			loop: timelineLoop
		});

		// Create metronome
		const rhythm = new Rhythm({
			bpm: 120,
			timeSignature: TimeSignature.four_four,
			subDivisions: 1
		});
		metronome = new Metronome(rhythm);

		// Create scene
		scene = new Scene();

		// Create sprite
		sprite = new Sprite();
		sprite.x = spriteX;
		sprite.y = spriteY;
		sprite.width = spriteSize;
		sprite.height = spriteSize;
		sprite.rotation = spriteRotation * (Math.PI / 180);
		sprite.scaleX = spriteScaleX;
		sprite.scaleY = spriteScaleX;
		sprite.fill = { type: 'color', value: spriteColor };
		(sprite as any).alpha = spriteAlpha;

		// Add sprite to scene
		scene.root.children.push(sprite);

		// Initialize keyframe optimizer
		keyframeOptimizer = new KeyframeOptimizer();

		// Create animatable object
		animatableObject = new AnimatableObject('Demo Sprite', {
			initialValues: {
				x: spriteX,
				y: spriteY,
				rotation: spriteRotation,
				scaleX: spriteScaleX,
				scaleY: spriteScaleX,
				alpha: spriteAlpha
			},
			properties: ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'alpha']
		});

		// Configure timeline
		timelineConfig = {
			timeline,
			metronome,
			sprites: [sprite],
			animatableObjects: [animatableObject],
			width: 800,
			height: 400,
			framerate: timelineFramerate,
			duration: timelineDuration,
			loop: timelineLoop,
			autoPlay: false,
			showRuler: true,
			showControls: true,
			recordingEnabled,
			inMarker,
			outMarker
		};

		// Set up timeline update listener
		timeline.on('timeUpdate', (data) => {
			updateSpriteFromTimeline(data.currentTime);
			renderScene();
		});

		// Set up keyframe optimizer event handlers
		keyframeOptimizer.on('recording:start', (data) => {
			console.log('Recording started for:', data.propertyName);
		});

		keyframeOptimizer.on('recording:stop', (data) => {
			console.log('Recording stopped for:', data.propertyName, 'samples:', data.sampleCount);
		});

		keyframeOptimizer.on('optimization:complete', (data) => {
			console.log('Optimization complete for:', data.propertyName, 'keyframes:', data.result.keyframes.length);
		});

		// Initial render
		renderScene();

		isInitialized = true;
	}

	function updateSpriteFromTimeline(currentTime: number) {
		if (!sprite || !animatableObject) return;

		// Update sprite from animatable object values at current time
		sprite.x = animatableObject.getPropertyValueAtTime('x', currentTime);
		sprite.y = animatableObject.getPropertyValueAtTime('y', currentTime);
		sprite.rotation = animatableObject.getPropertyValueAtTime('rotation', currentTime) * (Math.PI / 180);
		sprite.scaleX = animatableObject.getPropertyValueAtTime('scaleX', currentTime);
		sprite.scaleY = animatableObject.getPropertyValueAtTime('scaleY', currentTime);
		(sprite as any).alpha = animatableObject.getPropertyValueAtTime('alpha', currentTime);
	}

	function renderScene() {
		if (!ctx) return;

		// Clear canvas
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		// Draw grid
		drawGrid();

		// Draw sprite
		drawSprite();

		// Draw center point
		ctx.fillStyle = '#666';
		ctx.fillRect(canvasWidth / 2 - 2, canvasHeight / 2 - 2, 4, 4);
	}

	function drawGrid() {
		ctx.strokeStyle = '#333';
		ctx.lineWidth = 1;

		// Vertical lines
		for (let x = 0; x <= canvasWidth; x += 20) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, canvasHeight);
			ctx.stroke();
		}

		// Horizontal lines
		for (let y = 0; y <= canvasHeight; y += 20) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(canvasWidth, y);
			ctx.stroke();
		}
	}

	function drawSprite() {
		ctx.save();

		// Apply transformations
		ctx.translate(sprite.x, sprite.y);
		ctx.rotate(sprite.rotation);
		ctx.scale(sprite.scaleX, sprite.scaleY);
		ctx.globalAlpha = (sprite as any).alpha || 1;

		// Draw sprite
		ctx.fillStyle = sprite.fill.type === 'color' ? sprite.fill.value : '#4f8cff';
		const centerX = sprite.width / 2;
		const centerY = sprite.height / 2;
		ctx.fillRect(-centerX, -centerY, sprite.width, sprite.height);

		// Draw border
		if (spriteBorderWidth > 0) {
			ctx.strokeStyle = spriteBorderColor;
			ctx.lineWidth = spriteBorderWidth;
			ctx.strokeRect(-centerX, -centerY, sprite.width, sprite.height);
		}

		ctx.restore();
	}

	function cleanup() {
		if (animationFrameId !== undefined) {
			cancelAnimationFrame(animationFrameId);
		}

		if (timeline) {
			timeline.dispose();
		}

		if (metronome) {
			metronome.dispose();
		}

		if (keyframeOptimizer) {
			keyframeOptimizer.dispose();
		}

		if (animatableObject) {
			animatableObject.dispose();
		}
	}

	function restartDemo() {
		cleanup();
		setTimeout(() => {
			initializeDemo();
		}, 100);
	}

	function handleTimelineEvent(event: CustomEvent) {
		console.log('Timeline event:', event.type, event.detail);

		// Update playback state
		if (event.type === 'playback:play') {
			state.isPlaying = true;
		} else if (event.type === 'playback:pause' || event.type === 'playback:stop') {
			state.isPlaying = false;
		}

		// Update sprite state when timeline position changes
		if (event.type === 'playback:seek') {
			updateSpriteFromTimeline(event.detail.time);
			renderScene();
		} else if (event.type === 'playback:tick') {
			updateSpriteFromTimeline(event.detail.currentTime);
			renderScene();
		}
	}

	function handleKeyframeAdd(event: CustomEvent) {
		console.log('Keyframe added:', event.detail);
	// In a real implementation, this would update the sprite's animation properties
	}

	function handleRecordingStart(event: CustomEvent) {
		console.log('Recording started:', event.detail);

		// Start recording with animatable object
		if (animatableObject) {
			const properties = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'alpha'];
			animatableObject.startRecording(properties);
		}
	}

	function handleRecordingStop(event: CustomEvent) {
		console.log('Recording stopped:', event.detail);

		// Stop recording and create clips
		if (animatableObject) {
			const clips = animatableObject.stopRecording('Timeline Recording', {
				minTimeDelta: 0.1,
				minValueChange: 0.5,
				useCurveFitting: true,
				maxError: 2,
				snapToFrames: true,
				frameRate: timelineFramerate,
				removeRedundant: true
			});

			console.log('Created clips:', clips);
		}
	}

	function handleRotationChange(event: CustomEvent) {
		spriteRotation = event.detail.value;
		updateSprite();
	}

	// Control handlers
	function updateSprite() {
		if (sprite && animatableObject) {
			console.log('Updating sprite:', { spriteX, spriteY, spriteRotation, spriteScaleX, spriteAlpha });
			(sprite as any).name = spriteName;
			sprite.width = spriteSize;
			sprite.height = spriteSize;
			sprite.fill = { type: 'color', value: spriteColor };

			// Update animatable object properties
			animatableObject.setPropertyValue('x', spriteX);
			animatableObject.setPropertyValue('y', spriteY);
			animatableObject.setPropertyValue('rotation', spriteRotation);
			animatableObject.setPropertyValue('scaleX', spriteScaleX);
			animatableObject.setPropertyValue('scaleY', spriteScaleX);
			animatableObject.setPropertyValue('alpha', spriteAlpha);

			// Update sprite from animatable object
			sprite.x = spriteX;
			sprite.y = spriteY;
			sprite.rotation = spriteRotation * (Math.PI / 180);
			sprite.scaleX = spriteScaleX;
			sprite.scaleY = spriteScaleX;
			(sprite as any).alpha = spriteAlpha;

			// Capture keyframe data if recording is active
			if (keyframeOptimizer && keyframeOptimizer.getRecordingStatus().isRecording) {
				const currentTime = timeline ? timeline.currentTime : 0;
				keyframeOptimizer.captureDataPoint('x', currentTime, spriteX);
				keyframeOptimizer.captureDataPoint('y', currentTime, spriteY);
				keyframeOptimizer.captureDataPoint('rotation', currentTime, spriteRotation);
				keyframeOptimizer.captureDataPoint('scaleX', currentTime, spriteScaleX);
				keyframeOptimizer.captureDataPoint('scaleY', currentTime, spriteScaleX); // Use same scale
				keyframeOptimizer.captureDataPoint('alpha', currentTime, spriteAlpha);
			}

			renderScene();
		}
	}

	function updateTimelineSettings() {
		if (timeline) {
			timeline.duration = timelineDuration;
			timeline.framerate = timelineFramerate;
			timeline.loop = timelineLoop;

			// Update config
			timelineConfig = {
				...timelineConfig,
				duration: timelineDuration,
				framerate: timelineFramerate,
				loop: timelineLoop,
				recordingEnabled,
				inMarker,
				outMarker
			};
		}
	}

	// Reactive updates for timeline settings
	$: if (isInitialized) {
		updateTimelineSettings();
	}

	// Reactive sprite updates - trigger when any sprite property changes
	$: if (isInitialized && sprite && (
		spriteX || spriteY || spriteRotation || spriteScaleX || spriteAlpha ||
		spriteSize || spriteColor || spriteBorderWidth || spriteBorderColor
	)) {
		updateSprite();
	}
</script>

<div class="demo-container">
	<!-- Left Controls Panel (Red) -->
	<div class="controls-panel">
		<h3>Sprite Settings</h3>
		<div class="control-group">
			<label>
				Name:
				<input type="text" bind:value={spriteName} />
			</label>

			<label>
				Size:
				<input type="number" min="10" max="100" bind:value={spriteSize} />
			</label>

			<label>
				Color:
				<input type="color" bind:value={spriteColor} />
			</label>

			<label>
				Border Width:
				<input type="number" min="0" max="10" bind:value={spriteBorderWidth} />
			</label>

			<label>
				Border Color:
				<input type="color" bind:value={spriteBorderColor} />
			</label>
		</div>

		<h3>Transform</h3>
		<div class="control-group">
			<label>
				X: {spriteX}
				<input type="range" min="0" max={canvasWidth} bind:value={spriteX} class="slider" />
			</label>

			<label>
				Y: {spriteY}
				<input type="range" min="0" max={canvasHeight} bind:value={spriteY} class="slider" />
			</label>

			<label>
				Rotation: {spriteRotation}°
				<div class="rotation-control">
					<RotationDial bind:value={spriteRotation} on:change={handleRotationChange} />
				</div>
			</label>

			<label>
				Scale: {spriteScaleX.toFixed(2)}x
				<input type="range" min="0.25" max="4" step="0.25" bind:value={spriteScaleX} class="scale-slider" />
				<div class="scale-markers">
					<span>0.25</span>
					<span>1</span>
					<span>2</span>
					<span>3</span>
					<span>4</span>
				</div>
			</label>

			<label>
				Alpha: {spriteAlpha.toFixed(2)}
				<input type="range" min="0" max="1" step="0.01" bind:value={spriteAlpha} class="slider" />
			</label>
		</div>

		<h3>Timeline Settings</h3>
		<div class="control-group">
			<label>
				Duration:
				<input type="number" min="1" max="30" step="0.5" bind:value={timelineDuration} />
			</label>

			<label>
				Frame Rate:
				<input type="number" min="12" max="120" bind:value={timelineFramerate} />
			</label>

			<label>
				<input type="checkbox" bind:checked={timelineLoop} />
				Loop
			</label>

			<label>
				<input type="checkbox" bind:checked={recordingEnabled} />
				Recording
			</label>
		</div>

		{#if recordingEnabled}
			<div class="control-group">
				<label>
					In Marker:
					<input type="number" min="0" max={timelineDuration - 1} step="0.1" bind:value={inMarker} />
				</label>

				<label>
					Out Marker:
					<input type="number" min={inMarker + 0.1} max={timelineDuration} step="0.1" bind:value={outMarker} />
				</label>
			</div>
		{/if}

		<button on:click={restartDemo} class="restart-button">
			Restart
		</button>
	</div>

	<!-- Main Viewport (Blue) -->
	<div class="viewport">
		<canvas
			bind:this={canvasElement}
			width={canvasWidth}
			height={canvasHeight}
			class="demo-canvas"
		/>
	</div>

	<!-- Timeline Section (Green) -->
	<div class="timeline-section">
		{#if isInitialized && timelineConfig}
			<TimelineContainer
				config={timelineConfig}
				on:playback:play={handleTimelineEvent}
				on:playback:pause={handleTimelineEvent}
				on:playback:stop={handleTimelineEvent}
				on:playback:seek={handleTimelineEvent}
				on:playback:tick={handleTimelineEvent}
				on:keyframe:add={handleKeyframeAdd}
				on:keyframe:remove={handleTimelineEvent}
				on:keyframe:move={handleTimelineEvent}
				on:keyframe:select={handleTimelineEvent}
				on:recording:start={handleRecordingStart}
				on:recording:stop={handleRecordingStop}
				on:recording:capture={handleTimelineEvent}
			/>

			<!-- Clip Visualization -->
			{#if animatableObject}
				<div class="clips-section">
					<h3>Clips</h3>
					<div class="clips-container">
						{#each animatableObject.properties as property}
							<div class="property-clips">
								<div class="property-label">{property.name}</div>
								<div class="clips-track">
									{#each property.clips as clip}
										<div
											class="clip-bar"
											style="left: {(clip.startOffset / timelineDuration) * 100}%; width: {(clip.duration / timelineDuration) * 100}%;"
										>
											<div class="clip-name">{clip.metadata.name}</div>
											<div class="clip-keyframes">
												{#each clip.keyframes as keyframe}
													<div
														class="keyframe-dot"
														style="left: {((keyframe.time - clip.startOffset) / clip.duration) * 100}%;"
													></div>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .demo-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: #0a0a0a;
  }

  /* Controls Panel (Red) - Fixed width, full height */
  .controls-panel {
    position: absolute;
    top: 0;
    left: 0;
    width: 240px;
    height: 100vh;
    /* background: #ff0000; /* Red for visibility */
    border-right: 1px solid #333;
    padding: 16px;
    overflow-y: auto;
    box-sizing: border-box;
    z-index: 3;
  }

  /* Viewport (Blue) - Flexible width, height minus timeline */
  .viewport {
    position: absolute;
    top: 0;
    left: 240px; /* Start after controls panel */
    right: 0;
    bottom: 280px; /* Leave space for timeline */
    /* background: #0000ff; /* Blue for visibility */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  /* Timeline Section (Green) - Fixed height, flexible width */
  .timeline-section {
    position: absolute;
    bottom: 0;
    left: 240px; /* Start after controls panel */
    right: 0;
    height: 280px;
    background: #00ff00; /* Green for visibility */
    border-top: 1px solid #333;
    overflow: hidden;
    z-index: 2;
  }

  /* Control Panel Styling */
  .controls-panel h3 {
    color: #ffffff;
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
  }

  .control-group {
    margin-bottom: 20px;
  }

  .control-group label {
    display: block;
    margin-bottom: 8px;
    color: #ffffff;
    font-size: 12px;
  }

  .control-group input[type="text"],
  .control-group input[type="number"],
  .control-group input[type="color"] {
    width: 100%;
    padding: 4px 6px;
    background: #333;
    border: 1px solid #555;
    border-radius: 3px;
    color: #ffffff;
    font-size: 12px;
  }

  .control-group input[type="checkbox"] {
    margin-right: 6px;
    accent-color: #ffffff;
  }

  .slider {
    width: 100%;
    margin: 8px 0;
    accent-color: #ffffff;
  }

  .scale-slider {
    width: 100%;
    margin: 8px 0;
    accent-color: #ffffff;
  }

  .scale-markers {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #ccc;
    margin-top: -4px;
  }

  .rotation-control {
    display: flex;
    justify-content: center;
    margin: 8px 0;
  }

  .restart-button {
    background: #ffffff;
    color: #ff0000;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
    width: 100%;
  }

  .restart-button:hover {
    background: #f0f0f0;
  }

  /* Canvas Styling */
  .demo-canvas {
    border: 2px solid #ffffff;
    border-radius: 4px;
    background: #1a1a1a;
  }

  /* Clip Visualization */
  .clips-section {
    margin-top: 20px;
    padding: 15px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid #333;
  }

  .clips-section h3 {
    color: #ffffff;
    margin: 0 0 15px 0;
    font-size: 16px;
  }

  .clips-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .property-clips {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .property-label {
    min-width: 60px;
    color: #ffffff;
    font-size: 12px;
    text-align: right;
  }

  .clips-track {
    flex: 1;
    height: 30px;
    background: #2a2a2a;
    border-radius: 4px;
    position: relative;
    border: 1px solid #333;
  }

  .clip-bar {
    position: absolute;
    top: 2px;
    height: 26px;
    background: linear-gradient(135deg, #4f8cff, #64a3ff);
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    min-width: 40px;
    border: 1px solid #3a6db5;
  }

  .clip-bar:hover {
    background: linear-gradient(135deg, #64a3ff, #7bb3ff);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(79, 140, 255, 0.3);
  }

  .clip-name {
    color: #ffffff;
    font-size: 10px;
    font-weight: bold;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    max-width: 100%;
  }

  .clip-keyframes {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .keyframe-dot {
    position: absolute;
    top: 50%;
    width: 4px;
    height: 4px;
    background: #ffffff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  }
</style>
