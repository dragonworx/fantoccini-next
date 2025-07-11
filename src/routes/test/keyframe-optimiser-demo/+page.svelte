<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { KeyframeOptimizer } from '../../../lib/components/keyframe-optimizer/KeyframeOptimizer';
	import { DEFAULT_OPTIMIZATION_PARAMS } from '../../../lib/components/keyframe-optimizer/types/KeyframeOptimizerTypes';
	import type { KeyframeOptimizationParams, OptimizationResult } from '../../../lib/components/keyframe-optimizer/types/KeyframeOptimizerTypes';
  
	let optimizer: KeyframeOptimizer;
	let isRecording = false;
	let currentProperty = 'x';
	let mouseX = 0;
	let mouseY = 0;
	let recordingStartTime = 0;
	let recordingDuration = 0;
	let recordingInterval: number;
  
	// Optimization parameters
	const params: KeyframeOptimizationParams = { ...DEFAULT_OPTIMIZATION_PARAMS };
  
	// Results
	let optimizationResult: OptimizationResult | null = null;
	let rawDataPoints: Array<{ time: number; value: number }> = [];
	let isOptimizing = false;
  
	// Demo modes
	let demoMode: 'mouse' | 'sine' | 'noise' | 'step' = 'mouse';
	let demoProgress = 0;
  
	// Canvas elements
	let rawCanvas: HTMLCanvasElement;
	let optimizedCanvas: HTMLCanvasElement;
	let rawCtx: CanvasRenderingContext2D;
	let optimizedCtx: CanvasRenderingContext2D;
  
	onMount(() => {
		optimizer = new KeyframeOptimizer();
    
		// Set up event listeners
		optimizer.on('data:capture', (event) => {
			console.log('Data captured:', event);
		});
    
		optimizer.on('recording:start', (event) => {
			console.log('Recording started:', event);
		});
    
		optimizer.on('recording:stop', (event) => {
			console.log('Recording stopped:', event);
		});
    
		optimizer.on('optimization:complete', (event) => {
			console.log('Optimization complete:', event);
		});
    
		// Initialize canvases
		if (rawCanvas) {
			rawCtx = rawCanvas.getContext('2d')!;
		}
		if (optimizedCanvas) {
			optimizedCtx = optimizedCanvas.getContext('2d')!;
		}
		
		// Add keyboard event listener
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'r' || event.key === 'R') {
				event.preventDefault();
				toggleRecording();
			}
		};
		
		document.addEventListener('keydown', handleKeyDown);
		
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	});
  
	onDestroy(() => {
		if (optimizer) {
			optimizer.dispose();
		}
		if (recordingInterval) {
			clearInterval(recordingInterval);
		}
	});
  
	function startRecording() {
		if (isRecording) return;
    
		isRecording = true;
		recordingStartTime = Date.now();
		recordingDuration = 0;
		rawDataPoints = [];
		optimizationResult = null;
    
		optimizer.startRecording([currentProperty]);
    
		// Start recording interval
		recordingInterval = setInterval(() => {
			recordingDuration = (Date.now() - recordingStartTime) / 1000;
      
			let value: number;
			const time = recordingDuration;
      
			switch (demoMode) {
				case 'mouse':
					value = currentProperty === 'x' ? mouseX : mouseY;
					break;
				case 'sine':
					value = Math.sin(time * 2 * Math.PI) * 100 + 200;
					break;
				case 'noise':
					// Create more noisy data with a base trend plus random variations
					const baseTrend = 200 + Math.sin(time * 0.5) * 100;
					const noise = (Math.random() - 0.5) * 150;
					value = baseTrend + noise;
					break;
				case 'step':
					value = Math.floor(time / 2) * 100;
					break;
				default:
					value = 0;
			}
      
			optimizer.captureDataPoint(currentProperty, time, value);
			rawDataPoints.push({ time, value });
      
			// Update progress for demo modes
			if (demoMode !== 'mouse') {
				demoProgress = time;
			}
      
			drawRawData();
		}, 16); // ~60fps capture rate
	}
  
	function stopRecording() {
		if (!isRecording) return;
    
		isRecording = false;
		clearInterval(recordingInterval);
    
		const rawData = optimizer.stopRecording();
		console.log('Raw data collected:', rawData);
    
		// Optimize the data
		optimizeData();
	}
	
	function toggleRecording() {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	}
  
	function optimizeData() {
		if (!optimizer.getRawData(currentProperty)) return;
    
		isOptimizing = true;
		try {
			optimizationResult = optimizer.optimizeToKeyframes(currentProperty, params);
			console.log('Optimization result:', optimizationResult);
			drawOptimizedData();
		} catch (error) {
			console.error('Optimization failed:', error);
		} finally {
			isOptimizing = false;
		}
	}
  
	function clearData() {
		optimizer.clearAllRawData();
		rawDataPoints = [];
		optimizationResult = null;
		clearCanvases();
	}
  
	function handleMouseMove(event: MouseEvent) {
		if (demoMode === 'mouse') {
			const rect = event.currentTarget.getBoundingClientRect();
			mouseX = event.clientX - rect.left;
			mouseY = event.clientY - rect.top;
		}
	}
  
	function drawRawData() {
		if (!rawCtx || rawDataPoints.length === 0) return;
    
		const width = rawCanvas.width;
		const height = rawCanvas.height;
    
		rawCtx.clearRect(0, 0, width, height);
    
		// Draw grid
		rawCtx.strokeStyle = '#333';
		rawCtx.lineWidth = 1;
		for (let i = 0; i <= 10; i++) {
			const x = (i / 10) * width;
			const y = (i / 10) * height;
			rawCtx.beginPath();
			rawCtx.moveTo(x, 0);
			rawCtx.lineTo(x, height);
			rawCtx.stroke();
			rawCtx.beginPath();
			rawCtx.moveTo(0, y);
			rawCtx.lineTo(width, y);
			rawCtx.stroke();
		}
    
		// Draw data points
		rawCtx.strokeStyle = '#ff6b6b';
		rawCtx.lineWidth = 2;
		rawCtx.beginPath();
    
		const maxTime = Math.max(...rawDataPoints.map(p => p.time));
		const maxValue = Math.max(...rawDataPoints.map(p => p.value));
		const minValue = Math.min(...rawDataPoints.map(p => p.value));
		const valueRange = maxValue - minValue || 1;
    
		rawDataPoints.forEach((point, index) => {
			const x = (point.time / (maxTime || 1)) * width;
			const y = height - ((point.value - minValue) / valueRange) * height;
      
			if (index === 0) {
				rawCtx.moveTo(x, y);
			} else {
				rawCtx.lineTo(x, y);
			}
		});
    
		rawCtx.stroke();
    
		// Draw points
		rawCtx.fillStyle = '#ff6b6b';
		rawDataPoints.forEach(point => {
			const x = (point.time / (maxTime || 1)) * width;
			const y = height - ((point.value - minValue) / valueRange) * height;
			rawCtx.beginPath();
			rawCtx.arc(x, y, 2, 0, Math.PI * 2);
			rawCtx.fill();
		});
	}
  
	function drawOptimizedData() {
		if (!optimizedCtx || !optimizationResult) return;
    
		const width = optimizedCanvas.width;
		const height = optimizedCanvas.height;
    
		optimizedCtx.clearRect(0, 0, width, height);
    
		// Draw grid
		optimizedCtx.strokeStyle = '#333';
		optimizedCtx.lineWidth = 1;
		for (let i = 0; i <= 10; i++) {
			const x = (i / 10) * width;
			const y = (i / 10) * height;
			optimizedCtx.beginPath();
			optimizedCtx.moveTo(x, 0);
			optimizedCtx.lineTo(x, height);
			optimizedCtx.stroke();
			optimizedCtx.beginPath();
			optimizedCtx.moveTo(0, y);
			optimizedCtx.lineTo(width, y);
			optimizedCtx.stroke();
		}
    
		const keyframes = optimizationResult.keyframes;
		if (keyframes.length === 0) return;
    
		// Draw keyframes
		optimizedCtx.strokeStyle = '#4f8cff';
		optimizedCtx.lineWidth = 2;
		optimizedCtx.beginPath();
    
		const maxTime = Math.max(...keyframes.map(k => k.time));
		const maxValue = Math.max(...keyframes.map(k => k.value));
		const minValue = Math.min(...keyframes.map(k => k.value));
		const valueRange = maxValue - minValue || 1;
    
		keyframes.forEach((keyframe, index) => {
			const x = (keyframe.time / (maxTime || 1)) * width;
			const y = height - ((keyframe.value - minValue) / valueRange) * height;
      
			if (index === 0) {
				optimizedCtx.moveTo(x, y);
			} else {
				optimizedCtx.lineTo(x, y);
			}
		});
    
		optimizedCtx.stroke();
    
		// Draw keyframe points
		optimizedCtx.fillStyle = '#4f8cff';
		keyframes.forEach(keyframe => {
			const x = (keyframe.time / (maxTime || 1)) * width;
			const y = height - ((keyframe.value - minValue) / valueRange) * height;
			optimizedCtx.beginPath();
			optimizedCtx.arc(x, y, 4, 0, Math.PI * 2);
			optimizedCtx.fill();
		});
	}
  
	function clearCanvases() {
		if (rawCtx) {
			rawCtx.clearRect(0, 0, rawCanvas.width, rawCanvas.height);
		}
		if (optimizedCtx) {
			optimizedCtx.clearRect(0, 0, optimizedCanvas.width, optimizedCanvas.height);
		}
	}
  
	// Reactive updates
	$: if (optimizationResult) {
		drawOptimizedData();
	}
	
	// Re-optimize when parameters change
	$: if (optimizer && rawDataPoints.length > 0 && !isRecording && (
		params.minTimeDelta || 
		params.minValueChange || 
		params.maxError || 
		params.useCurveFitting || 
		params.snapToFrames || 
		params.removeRedundant || 
		params.smoothingFactor || 
		params.frameRate
	)) {
		// Trigger re-optimization when any parameter changes
		optimizeData();
	}
</script>

<div class="demo-container">
	<h1>Keyframe Optimizer Demo</h1>
  
	<div class="demo-content">
		<!-- Controls -->
		<div class="controls-panel">
			<h2>Recording Controls</h2>
      
			<div class="control-group">
				<label>
					Demo Mode:
					<select bind:value={demoMode}>
						<option value="mouse">Mouse Movement</option>
						<option value="sine">Sine Wave</option>
						<option value="noise">Random Noise</option>
						<option value="step">Step Function</option>
					</select>
				</label>
        
				<label>
					Property:
					<select bind:value={currentProperty}>
						<option value="x">X Position</option>
						<option value="y">Y Position</option>
						<option value="rotation">Rotation</option>
						<option value="scale">Scale</option>
					</select>
				</label>
			</div>
      
			<div class="control-group">
				<button 
					class="record-button" 
					class:recording={isRecording}
					on:click={isRecording ? stopRecording : startRecording}
				>
					{isRecording ? 'Stop Recording' : 'Start Recording'}
				</button>
        
				<button on:click={clearData}>Clear Data</button>
        
				{#if !isRecording && rawDataPoints.length > 0}
					<button on:click={optimizeData}>Re-optimize</button>
				{/if}
			</div>
			
			<div class="keyboard-shortcut">
				<p>Press <kbd>R</kbd> to toggle recording</p>
			</div>
      
			{#if isRecording}
				<div class="recording-info">
					<p>Recording: {recordingDuration.toFixed(2)}s</p>
					<p>Samples: {rawDataPoints.length}</p>
				</div>
			{/if}
      
			<h2>Optimization Parameters {#if isOptimizing}<span class="optimizing-indicator">Optimizing...</span>{/if}</h2>
      
			<div class="control-group">
				<label>
					Min Time Delta:
					<input type="number" bind:value={params.minTimeDelta} step="0.01" min="0" max="1" />
				</label>
        
				<label>
					Min Value Change:
					<input type="number" bind:value={params.minValueChange} step="0.001" min="0" max="10" />
				</label>
        
				<label>
					Max Error:
					<input type="number" bind:value={params.maxError} step="0.001" min="0" max="10" />
				</label>
			</div>
      
			<div class="control-group">
				<label>
					<input type="checkbox" bind:checked={params.useCurveFitting} />
					Use Curve Fitting
				</label>
        
				<label>
					<input type="checkbox" bind:checked={params.snapToFrames} />
					Snap to Frames
				</label>
        
				<label>
					<input type="checkbox" bind:checked={params.removeRedundant} />
					Remove Redundant
				</label>
			</div>
      
			<div class="control-group">
				<label>
					Frame Rate:
					<input type="number" bind:value={params.frameRate} min="1" max="120" />
				</label>
        
				<label>
					Smoothing Factor: {params.smoothingFactor.toFixed(2)}
					<input type="range" bind:value={params.smoothingFactor} min="0" max="1" step="0.01" />
					<div class="smoothing-note">
						{#if params.smoothingFactor === 0}
							<span class="note-text">No smoothing</span>
						{:else if params.smoothingFactor < 0.3}
							<span class="note-text">Light smoothing</span>
						{:else if params.smoothingFactor < 0.7}
							<span class="note-text">Medium smoothing</span>
						{:else}
							<span class="note-text">Heavy smoothing</span>
						{/if}
					</div>
				</label>
			</div>
		</div>
    
		<!-- Visualization -->
		<div class="visualization-panel">
			<h2>Data Visualization</h2>
      
			{#if demoMode === 'mouse'}
				<div class="mouse-area" on:mousemove={handleMouseMove}>
					<p>Move your mouse around this area to generate data</p>
					<div class="mouse-indicator" style="left: {mouseX}px; top: {mouseY}px;"></div>
				</div>
			{:else}
				<div class="demo-progress">
					<p>Demo Progress: {demoProgress.toFixed(2)}s</p>
					<div class="progress-bar">
						<div class="progress-fill" style="width: {Math.min(demoProgress * 10, 100)}%"></div>
					</div>
				</div>
			{/if}
      
			<div class="canvas-container">
				<div class="canvas-section">
					<h3>Raw Data ({rawDataPoints.length} points)</h3>
					<canvas bind:this={rawCanvas} width="400" height="200" class="data-canvas raw-canvas"></canvas>
				</div>
        
				<div class="canvas-section">
					<h3>Optimized Keyframes {optimizationResult ? `(${optimizationResult.keyframes.length} keyframes)` : ''}</h3>
					<canvas bind:this={optimizedCanvas} width="400" height="200" class="data-canvas optimized-canvas"></canvas>
				</div>
			</div>
      
			{#if optimizationResult}
				<div class="results">
					<h3>Optimization Results</h3>
					<div class="result-stats">
						<div class="stat">
							<label>Original Points:</label>
							<span>{optimizationResult.originalCount}</span>
						</div>
						<div class="stat">
							<label>Optimized Keyframes:</label>
							<span>{optimizationResult.optimizedCount}</span>
						</div>
						<div class="stat">
							<label>Compression Ratio:</label>
							<span>{(optimizationResult.compressionRatio * 100).toFixed(1)}%</span>
						</div>
						<div class="stat">
							<label>Processing Time:</label>
							<span>{optimizationResult.processingTime.toFixed(2)}ms</span>
						</div>
						<div class="stat">
							<label>Algorithm:</label>
							<span>{optimizationResult.metadata.algorithm}</span>
						</div>
					</div>
          
					<div class="keyframes-list">
						<h4>Generated Keyframes:</h4>
						<div class="keyframes-container">
							{#each optimizationResult.keyframes as keyframe, index}
								<div class="keyframe-item">
									<span class="keyframe-index">{index + 1}</span>
									<span class="keyframe-time">{keyframe.time.toFixed(3)}s</span>
									<span class="keyframe-value">{keyframe.value.toFixed(2)}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
  .demo-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: #0a0a0a;
    color: #ffffff;
  }
  
  h1 {
    text-align: center;
    color: #4f8cff;
    margin: 20px 0;
  }
  
  .demo-content {
    flex: 1;
    display: flex;
    gap: 20px;
    padding: 0 20px 20px;
    overflow: hidden;
  }
  
  .controls-panel {
    width: 300px;
    background: #1a1a1a;
    border-radius: 8px;
    padding: 20px;
    overflow-y: auto;
    border: 1px solid #333;
  }
  
  .visualization-panel {
    flex: 1;
    background: #1a1a1a;
    border-radius: 8px;
    padding: 20px;
    overflow-y: auto;
    border: 1px solid #333;
  }
  
  h2 {
    color: #4f8cff;
    margin: 0 0 15px 0;
    font-size: 18px;
  }
  
  h3 {
    color: #cccccc;
    margin: 0 0 10px 0;
    font-size: 14px;
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
  
  .control-group input,
  .control-group select {
    width: 100%;
    padding: 4px 6px;
    background: #333;
    border: 1px solid #555;
    border-radius: 3px;
    color: #ffffff;
    font-size: 12px;
  }
  
  .control-group input[type="checkbox"] {
    width: auto;
    margin-right: 6px;
  }
  
  .record-button {
    background: #666;
    color: #ffffff;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-right: 10px;
    transition: background 0.2s;
  }
  
  .record-button.recording {
    background: #ff6b6b;
    animation: pulse 1s infinite;
  }
  
  .record-button:hover {
    background: #777;
  }
  
  .record-button.recording:hover {
    background: #ff8e8e;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  button {
    background: #4f8cff;
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    margin-right: 10px;
    transition: background 0.2s;
  }
  
  button:hover {
    background: #64a3ff;
  }
  
  .recording-info {
    background: #333;
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
  }
  
  .recording-info p {
    margin: 4px 0;
    font-size: 12px;
  }
  
  .mouse-area {
    position: relative;
    width: 100%;
    height: 150px;
    background: #333;
    border-radius: 4px;
    border: 2px dashed #666;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    cursor: crosshair;
  }
  
  .mouse-indicator {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #ff6b6b;
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
  }
  
  .demo-progress {
    margin-bottom: 20px;
  }
  
  .progress-bar {
    width: 100%;
    height: 20px;
    background: #333;
    border-radius: 10px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: #4f8cff;
    transition: width 0.1s ease;
  }
  
  .canvas-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .canvas-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .data-canvas {
    border: 2px solid #555;
    border-radius: 4px;
    background: #222;
  }
  
  .raw-canvas {
    border-color: #ff6b6b;
  }
  
  .optimized-canvas {
    border-color: #4f8cff;
  }
  
  .results {
    margin-top: 20px;
    padding: 15px;
    background: #333;
    border-radius: 4px;
  }
  
  .result-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .stat {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
  }
  
  .stat label {
    color: #ccc;
  }
  
  .stat span {
    color: #4f8cff;
    font-weight: bold;
  }
  
  .keyframes-list {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .keyframes-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .keyframe-item {
    display: flex;
    justify-content: space-between;
    padding: 4px 8px;
    background: #2a2a2a;
    border-radius: 3px;
    font-size: 11px;
  }
  
  .keyframe-index {
    color: #666;
    min-width: 20px;
  }
  
  .keyframe-time {
    color: #4f8cff;
    min-width: 60px;
  }
  
  .keyframe-value {
    color: #ffffff;
  }
  
  .keyboard-shortcut {
    margin: 10px 0;
    padding: 8px;
    background: #2a2a2a;
    border-radius: 4px;
    border: 1px solid #444;
  }
  
  .keyboard-shortcut p {
    margin: 0;
    font-size: 12px;
    color: #ccc;
    text-align: center;
  }
  
  .keyboard-shortcut kbd {
    background: #4f8cff;
    color: #ffffff;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: bold;
  }
  
  .smoothing-note {
    margin-top: 4px;
  }
  
  .note-text {
    font-size: 11px;
    color: #999;
    font-style: italic;
  }
  
  .optimizing-indicator {
    font-size: 12px;
    color: #4f8cff;
    font-weight: normal;
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>