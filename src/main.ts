// Main entry point for the Fantoccini test page
import { Metronome, Rhythm } from '@core/metronome';

// Simple logger to display messages in the UI
class UILogger {
	private logContainer: HTMLElement;
	private maxLogs = 20;
	
	constructor(containerId: string) {
		const container = document.getElementById(containerId);
		if (!container) {
			throw new Error(`Container with id "${containerId}" not found`);
		}
		this.logContainer = container;
	}
	
	public log(message: string): void {
		const entry = document.createElement('div');
		entry.className = 'log-entry';
		entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
		
		this.logContainer.insertBefore(entry, this.logContainer.firstChild);
		
		// Keep only the latest logs
		while (this.logContainer.children.length > this.maxLogs) {
			this.logContainer.removeChild(this.logContainer.lastChild!);
		}
	}
}

// Initialize the demo
function initDemo(): void {
	const logger = new UILogger('console-log');
	logger.log('Fantoccini test page initialized');
	
	// Get UI elements
	const startBtn = document.getElementById('start-metronome') as HTMLButtonElement;
	const stopBtn = document.getElementById('stop-metronome') as HTMLButtonElement;
	const statusEl = document.getElementById('status') as HTMLSpanElement;
	const beatEl = document.getElementById('beat') as HTMLSpanElement;
	const bpmEl = document.getElementById('bpm') as HTMLSpanElement;
	
	// Create metronome instance
	const rhythm = new Rhythm({ bpm: 120 });
	const metronome = new Metronome(rhythm);
	
	// Subscribe to metronome pulses
	metronome.onPulse((pulse) => {
		beatEl.textContent = pulse.beat.toString();
		logger.log(`Beat ${pulse.beat} of measure ${pulse.measure}`);
	});
	
	// Handle start button
	startBtn.addEventListener('click', () => {
		metronome.start();
		statusEl.textContent = 'Running';
		startBtn.style.display = 'none';
		stopBtn.style.display = 'inline-block';
		logger.log('Metronome started');
	});
	
	// Handle stop button
	stopBtn.addEventListener('click', () => {
		metronome.stop();
		statusEl.textContent = 'Stopped';
		startBtn.style.display = 'inline-block';
		stopBtn.style.display = 'none';
		beatEl.textContent = '0';
		logger.log('Metronome stopped');
	});
	
	// Display current BPM
	bpmEl.textContent = rhythm.bpm.toString();
	
	// Example: Change tempo after 5 seconds (commented out)
	// setTimeout(() => {
	//     const newRhythm = new Rhythm({ bpm: 140 });
	//     metronome.update(newRhythm);
	//     bpmEl.textContent = '140';
	//     logger.log('Tempo changed to 140 BPM');
	// }, 5000);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initDemo);
} else {
	initDemo();
}