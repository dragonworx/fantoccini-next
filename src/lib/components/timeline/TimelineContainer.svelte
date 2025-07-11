<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { Timeline } from '../../../core/timeline/index.js';
	import type { ITimeline, IKeyframe } from '../../../core/timeline/index.js';
	import type { Sprite } from '../../../core/object/sprite.js';
	import type { Metronome } from '../../../core/metronome/index.js';
	import type { TimelineConfig, TimelineState, TimelineViewport, TimelineTrackConfig, RecordingState } from './types/TimelineTypes.js';
	import { DEFAULT_TIMELINE_THEME } from './types/TimelineTypes.js';
	import { PlaybackService } from './services/PlaybackService.js';
	import { KeyframeService } from './services/KeyframeService.js';
	import { mergeTheme, generateId } from './utils/TimelineUtils.js';
  
	import TimelineControls from './TimelineControls.svelte';
	import TimelineRuler from './TimelineRuler.svelte';
	import TimelineTrack from './TimelineTrack.svelte';
  
	export let config: TimelineConfig;
  
	const dispatch = createEventDispatcher();
  
	// Services
	let playbackService: PlaybackService;
	let keyframeService: KeyframeService;
  
	// State
	const state: TimelineState = {
		isPlaying: false,
		currentTime: 0,
		duration: config.duration || 10,
		framerate: config.framerate || 60,
		loop: config.loop || false,
		speed: 1,
		tracks: [],
		viewport: {
			startTime: 0,
			endTime: config.duration || 10,
			scale: 1,
			offsetX: 0,
			width: 1000,
			height: 400
		},
		recording: {
			enabled: config.recordingEnabled || false,
			active: false,
			inTime: config.inMarker || 0,
			outTime: config.outMarker || (config.duration || 10),
			capturedKeyframes: new Map()
		},
		selectedKeyframes: new Set()
	};
  
	// Theme
	$: theme = mergeTheme(config.theme || {}, DEFAULT_TIMELINE_THEME);
  
	// Container element
	let containerElement: HTMLDivElement;
  
	// Reactive updates
	$: if (playbackService) {
		playbackService.setDuration(state.duration);
		playbackService.setFramerate(state.framerate);
		playbackService.setLoop(state.loop);
	}
  
	onMount(() => {
		// Initialize services
		playbackService = new PlaybackService(config.timeline, config.metronome);
		keyframeService = new KeyframeService();
    
		// Set up event listeners
		setupEventListeners();
    
		// Initialize tracks from sprites
		initializeTracks();
    
		// Update viewport size
		updateViewportSize();
    
		// Auto-play if enabled
		if (config.autoPlay) {
			playbackService.play();
		}
	});
  
	onDestroy(() => {
		if (playbackService) {
			playbackService.dispose();
		}
		if (keyframeService) {
			keyframeService.dispose();
		}
	});
  
	function setupEventListeners() {
		// Playback events
		playbackService.on('playback:play', (data) => {
			state.isPlaying = true;
			dispatch('playback:play', data);
		});
    
		playbackService.on('playback:pause', (data) => {
			state.isPlaying = false;
			dispatch('playback:pause', data);
		});
    
		playbackService.on('playback:stop', (data) => {
			state.isPlaying = false;
			dispatch('playback:stop', data);
		});
    
		playbackService.on('playback:seek', (data) => {
			state.currentTime = data.time;
			dispatch('playback:seek', data);
		});
    
		playbackService.on('playback:tick', (data) => {
			state.currentTime = data.currentTime;
      
			// Check recording mode
			if (state.recording.enabled && state.isPlaying) {
				handleRecordingTick(data.currentTime);
			}
      
			dispatch('playback:tick', data);
		});
    
		// Keyframe events
		keyframeService.on('keyframe:add', (data) => {
			dispatch('keyframe:add', data);
		});
    
		keyframeService.on('keyframe:remove', (data) => {
			dispatch('keyframe:remove', data);
		});
    
		keyframeService.on('keyframe:move', (data) => {
			dispatch('keyframe:move', data);
		});
    
		keyframeService.on('keyframe:select', (data) => {
			// Update selected keyframes
			if (!data.multiSelect) {
				state.selectedKeyframes.clear();
			}
			for (const id of data.keyframeIds) {
				state.selectedKeyframes.add(id);
			}
			state.selectedKeyframes = new Set(state.selectedKeyframes);
			dispatch('keyframe:select', data);
		});
    
		keyframeService.on('keyframe:deselect', (data) => {
			for (const id of data.keyframeIds) {
				state.selectedKeyframes.delete(id);
			}
			state.selectedKeyframes = new Set(state.selectedKeyframes);
			dispatch('keyframe:deselect', data);
		});
	}
  
	function initializeTracks() {
		const tracks: TimelineTrackConfig[] = [];
    
		// Create tracks for each sprite property
		for (const sprite of config.sprites) {
			const properties = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'alpha'];
      
			for (const property of properties) {
				const trackId = generateId(`track_${sprite.name || 'sprite'}_${property}`);
				const track: TimelineTrackConfig = {
					id: trackId,
					sprite,
					property,
					label: `${sprite.name || 'Sprite'} ${property}`,
					color: getPropertyColor(property),
					visible: true,
					muted: false,
					height: theme.tracks.height,
					keyframes: []
				};
        
				tracks.push(track);
			}
		}
    
		state.tracks = tracks;
	}
  
	function getPropertyColor(property: string): string {
		const colors: Record<string, string> = {
			x: '#ff6b6b',
			y: '#4ecdc4',
			rotation: '#45b7d1',
			scaleX: '#96ceb4',
			scaleY: '#ffeaa7',
			alpha: '#dda0dd'
		};
		return colors[property] || theme.colors.primary;
	}
  
	function updateViewportSize() {
		if (containerElement) {
			const rect = containerElement.getBoundingClientRect();
			state.viewport.width = rect.width;
			state.viewport.height = rect.height;
		}
	}
  
	function handleRecordingTick(currentTime: number) {
		if (!state.recording.active) {
			// Check if we're entering the recording region
			if (currentTime >= state.recording.inTime && currentTime <= state.recording.outTime) {
				state.recording.active = true;
				dispatch('recording:start', { 
					inTime: state.recording.inTime, 
					outTime: state.recording.outTime 
				});
			}
		} else {
			// We're in recording mode
			if (currentTime > state.recording.outTime) {
				// Exiting recording region
				state.recording.active = false;
				dispatch('recording:stop', { 
					keyframesRecorded: state.recording.capturedKeyframes.size 
				});
			} else {
				// Capture keyframes
				captureKeyframes(currentTime);
			}
		}
	}
  
	function captureKeyframes(time: number) {
		for (const track of state.tracks) {
			if (track.visible && !track.muted) {
				const currentValue = getSpritePropertyValue(track.sprite, track.property);
        
				// Only capture if value has changed significantly
				const lastKeyframes = keyframeService.getKeyframes(track.id);
				const shouldCapture = lastKeyframes.length === 0 || 
					Math.abs(time - lastKeyframes[lastKeyframes.length - 1].time) > 0.1;
        
				if (shouldCapture) {
					keyframeService.addKeyframe(track.id, time, currentValue);
          
					dispatch('recording:capture', {
						time,
						property: track.property,
						value: currentValue
					});
				}
			}
		}
	}
  
	function getSpritePropertyValue(sprite: Sprite, property: string): any {
		switch (property) {
			case 'x': return sprite.x;
			case 'y': return sprite.y;
			case 'rotation': return sprite.rotation;
			case 'scaleX': return sprite.scaleX;
			case 'scaleY': return sprite.scaleY;
			case 'alpha': return 1; // Sprite doesn't have alpha property, default to 1
			default: return 0;
		}
	}
  
	// Event handlers
	function handleSeek(event: CustomEvent) {
		playbackService.seek(event.detail.time);
	}
  
	function handleDurationChange(event: CustomEvent) {
		state.duration = event.detail.duration;
		state.viewport.endTime = state.duration;
	}
  
	function handleFramerateChange(event: CustomEvent) {
		state.framerate = event.detail.framerate;
	}
  
	function handleLoopChange(event: CustomEvent) {
		state.loop = event.detail.loop;
	}
  
	function handleSpeedChange(event: CustomEvent) {
		state.speed = event.detail.speed;
	}
  
	function handleRecordingToggle(event: CustomEvent) {
		state.recording.enabled = event.detail.enabled;
	}
  
	function handleInMarkerChange(event: CustomEvent) {
		state.recording.inTime = event.detail.time;
	}
  
	function handleOutMarkerChange(event: CustomEvent) {
		state.recording.outTime = event.detail.time;
	}
  
	function handleKeyframeAdd(event: CustomEvent) {
		const { trackId, time, value } = event.detail;
		keyframeService.addKeyframe(trackId, time, value);
	}
  
	function handleKeyframeRemove(event: CustomEvent) {
		const { trackId, keyframeId } = event.detail;
		keyframeService.removeKeyframe(trackId, keyframeId);
	}
  
	function handleKeyframeMove(event: CustomEvent) {
		const { trackId, keyframeId, newTime } = event.detail;
		keyframeService.moveKeyframe(trackId, keyframeId, newTime);
	}
  
	function handleKeyframeSelect(event: CustomEvent) {
		const { trackId, keyframeIds, multiSelect } = event.detail;
		keyframeService.selectKeyframes(trackId, keyframeIds, multiSelect);
	}
  
	function handleKeyframeDeselect(event: CustomEvent) {
		const { trackId, keyframeIds } = event.detail;
		keyframeService.deselectKeyframes(trackId, keyframeIds);
	}
  
	function handleKeyframeEasing(event: CustomEvent) {
		const { trackId, keyframeId, interpolation, controlPoints } = event.detail;
		keyframeService.setKeyframeInterpolation(trackId, keyframeId, interpolation, controlPoints);
	}
  
	function handleTrackToggle(event: CustomEvent) {
		const { trackId, visible } = event.detail;
		const track = state.tracks.find(t => t.id === trackId);
		if (track) {
			track.visible = visible;
			state.tracks = [...state.tracks];
		}
	}
  
	function handleTrackMute(event: CustomEvent) {
		const { trackId, muted } = event.detail;
		const track = state.tracks.find(t => t.id === trackId);
		if (track) {
			track.muted = muted;
			state.tracks = [...state.tracks];
		}
	}
  
	// Resize handler
	function handleResize() {
		updateViewportSize();
	}
</script>

<svelte:window on:resize={handleResize} />

<div
	bind:this={containerElement}
	class="timeline-container"
	style="width: {config.width || '100%'}; height: {config.height || '400px'};"
>
	<!-- Timeline Controls -->
	{#if config.showControls !== false}
		<TimelineControls
			{playbackService}
			currentTime={state.currentTime}
			duration={state.duration}
			framerate={state.framerate}
			isPlaying={state.isPlaying}
			loop={state.loop}
			speed={state.speed}
			recordingEnabled={state.recording.enabled}
			recordingActive={state.recording.active}
			inMarker={state.recording.inTime}
			outMarker={state.recording.outTime}
			on:seek={handleSeek}
			on:timeline:duration={handleDurationChange}
			on:timeline:framerate={handleFramerateChange}
			on:timeline:loop={handleLoopChange}
			on:playback:speed={handleSpeedChange}
			on:recording:toggle={handleRecordingToggle}
			on:marker:in={handleInMarkerChange}
			on:marker:out={handleOutMarkerChange}
		/>
	{/if}
  
	<!-- Timeline Ruler -->
	{#if config.showRuler !== false}
		<TimelineRuler
			viewport={state.viewport}
			framerate={state.framerate}
			currentTime={state.currentTime}
			inMarker={state.recording.inTime}
			outMarker={state.recording.outTime}
			showMarkers={true}
			showRecordingRegion={state.recording.enabled}
			{theme}
			on:seek={handleSeek}
			on:marker:in={handleInMarkerChange}
			on:marker:out={handleOutMarkerChange}
		/>
	{/if}
  
	<!-- Timeline Tracks -->
	<div class="timeline-tracks">
		{#each state.tracks as track (track.id)}
			<TimelineTrack
				{track}
				viewport={state.viewport}
				keyframes={keyframeService.getKeyframesWithIds(track.id)}
				selectedKeyframes={state.selectedKeyframes}
				currentTime={state.currentTime}
				framerate={state.framerate}
				{theme}
				allowClickToAdd={false}
				on:keyframe:add={handleKeyframeAdd}
				on:keyframe:remove={handleKeyframeRemove}
				on:keyframe:move={handleKeyframeMove}
				on:keyframe:select={handleKeyframeSelect}
				on:keyframe:deselect={handleKeyframeDeselect}
				on:keyframe:easing={handleKeyframeEasing}
				on:track:toggle={handleTrackToggle}
				on:track:mute={handleTrackMute}
			/>
		{/each}
	</div>
</div>

<style>
  .timeline-container {
    display: flex;
    flex-direction: column;
    background: #1a1a1a;
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    border: 1px solid #333;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .timeline-tracks {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  .timeline-tracks::-webkit-scrollbar {
    width: 8px;
  }
  
  .timeline-tracks::-webkit-scrollbar-track {
    background: #1a1a1a;
  }
  
  .timeline-tracks::-webkit-scrollbar-thumb {
    background: #3a3a3a;
    border-radius: 4px;
  }
  
  .timeline-tracks::-webkit-scrollbar-thumb:hover {
    background: #4a4a4a;
  }
</style>