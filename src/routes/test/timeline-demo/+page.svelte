<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Timeline } from '../../../core/timeline/index.js';
	import { Sprite } from '../../../core/object/sprite.js';
	import { Scene } from '../../../core/object/scene.js';
	import { Metronome, Rhythm, TimeSignature } from '../../../core/metronome/index.js';
	import TimelineContainer from '../../../lib/components/timeline/TimelineContainer.svelte';
	import RotationDial from '../../../lib/components/controls/RotationDial.svelte';
	import { KeyframeOptimizer } from '../../../lib/components/keyframe-optimizer/KeyframeOptimizer.js';
	import type { TimelineConfig } from '../../../lib/components/timeline/types/TimelineTypes.js';
  
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
    
		// Configure timeline
		timelineConfig = {
			timeline,
			metronome,
			sprites: [sprite],
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
		if (!sprite) return;
    
		// This would normally be handled by the timeline system
    // For demo purposes, we'll create some simple animations
    
    // Animate position in a circle
		const radius = 100;
		const angle = (currentTime / timelineDuration) * Math.PI * 2;
		const centerX = canvasWidth / 2;
		const centerY = canvasHeight / 2;
    
		sprite.x = centerX + Math.cos(angle) * radius;
		sprite.y = centerY + Math.sin(angle) * radius;
    
		// Animate rotation
		sprite.rotation = angle * 2;
    
		// Animate scale
		sprite.scaleX = sprite.scaleY = 1 + Math.sin(angle * 3) * 0.3;
    
		// Animate alpha (stored in a custom property since Sprite doesn't have alpha)
		(sprite as any).alpha = 0.5 + Math.sin(angle * 2) * 0.3;
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
    
		// Start recording with keyframe optimizer
		if (keyframeOptimizer) {
			const properties = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'alpha'];
			keyframeOptimizer.startRecording(properties);
		}
	}
  
	function handleRecordingStop(event: CustomEvent) {
		console.log('Recording stopped:', event.detail);
    
		// Stop recording and optimize keyframes
		if (keyframeOptimizer) {
			const rawData = keyframeOptimizer.stopRecording();
      
			// Optimize each recorded property
			rawData.forEach((data, propertyName) => {
				if (data.dataPoints.length > 0) {
					try {
						const optimized = keyframeOptimizer.optimizeToKeyframes(propertyName, {
							minTimeDelta: 0.1,
							minValueChange: 0.5,
							useCurveFitting: true,
							maxError: 2,
							snapToFrames: true,
							frameRate: timelineFramerate,
							removeRedundant: true
						});
            
						console.log(`Optimized ${propertyName}:`, optimized);
					} catch (error) {
						console.error(`Failed to optimize ${propertyName}:`, error);
					}
				}
			});
		}
	}
  
	function handleRotationChange(event: CustomEvent) {
		spriteRotation = event.detail.value;
		updateSprite();
	}
  
	// Control handlers
	function updateSprite() {
		if (sprite) {
			console.log('Updating sprite:', { spriteX, spriteY, spriteRotation, spriteScaleX, spriteAlpha });
			(sprite as any).name = spriteName;
			sprite.width = spriteSize;
			sprite.height = spriteSize;
			sprite.x = spriteX;
			sprite.y = spriteY;
			sprite.rotation = spriteRotation * (Math.PI / 180); // Convert degrees to radians
			sprite.scaleX = spriteScaleX;
			sprite.scaleY = spriteScaleX; // Use same scale for both axes
			sprite.fill = { type: 'color', value: spriteColor };
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
	<div class="main-content">
		<!-- Left Controls Panel -->
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
    
		<!-- Main Viewport -->
		<div class="viewport">
			<canvas
				bind:this={canvasElement}
				width={canvasWidth}
				height={canvasHeight}
				class="demo-canvas"
			/>
		</div>
	</div>
  
	<!-- Timeline at Bottom -->
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
		{/if}
	</div>
</div>

<style>
  .demo-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: #0a0a0a;
  }
  
  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  .controls-panel {
    width: 240px;
    background: #1a1a1a;
    border-right: 1px solid #333;
    padding: 16px;
    overflow-y: auto;
    flex-shrink: 0;
  }
  
  .controls-panel h3 {
    color: #4f8cff;
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
    color: #cccccc;
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
    accent-color: #4f8cff;
  }
  
  .slider {
    width: 100%;
    margin: 8px 0;
    accent-color: #4f8cff;
  }
  
  .scale-slider {
    width: 100%;
    margin: 8px 0;
    accent-color: #4f8cff;
  }
  
  .scale-markers {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #999;
    margin-top: -4px;
  }
  
  .rotation-control {
    display: flex;
    justify-content: center;
    margin: 8px 0;
  }
  
  .viewport {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2a2a2a;
  }
  
  .demo-canvas {
    border: 2px solid #4f8cff;
    border-radius: 4px;
    background: #1a1a1a;
  }
  
  .timeline-section {
    height: 280px;
    background: #1a1a1a;
    border-top: 1px solid #333;
    flex-shrink: 0;
  }
  
  .restart-button {
    background: #4f8cff;
    color: #ffffff;
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
    background: #64a3ff;
  }
</style>