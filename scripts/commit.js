#!/usr/bin/env node

import { execSync } from 'child_process';
import { stdin, stdout } from 'process';
import { createInterface } from 'readline';

// Color constants for terminal styling
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
	bgRed: '\x1b[41m',
	bgGreen: '\x1b[42m',
	bgYellow: '\x1b[43m',
	bgBlue: '\x1b[44m',
	bgMagenta: '\x1b[45m',
	bgCyan: '\x1b[46m'
};

// Commit types configuration - easy to extend
const commitTypes = [
 	{
		name: 'wip',
		description: 'Work in progress, incremental changes',
		color: colors.yellow,
		icon: '⚡'
	},
	{
		name: 'fixes',
		description: 'Bug fixes and corrections',
		color: colors.red,
		icon: '🔧'
	},
];

class CommitScript {
	constructor() {
		this.selectedIndex = 0;
		this.rl = createInterface({
			input: stdin,
			output: stdout
		});

		// Setup keypress handling
		stdin.setRawMode(true);
		stdin.resume();
		stdin.setEncoding('utf8');
	}

	// Display greeting and instructions
	showGreeting() {
		console.clear();
		console.log(`${colors.bright}${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
		console.log(`${colors.bright}${colors.cyan}║           Git Commit Helper            ║${colors.reset}`);
		console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════╝${colors.reset}`);
		console.log();
		console.log(`${colors.dim}Select a commit type:${colors.reset}`);
		console.log(`${colors.dim}• Use ↑/↓ arrow keys or number keys to select${colors.reset}`);
		console.log(`${colors.dim}• Press Enter/Space to confirm${colors.reset}`);
		console.log(`${colors.dim}• Press Ctrl+C to exit${colors.reset}`);
		console.log();
	}

	// Display the commit type menu
	showMenu() {
		commitTypes.forEach((type, index) => {
			const isSelected = index === this.selectedIndex;
			const prefix = isSelected ? '→' : ' ';
			const style = isSelected ? colors.bright : colors.dim;
			const bg = isSelected ? colors.bgBlue : '';

			console.log(`${bg}${style}${prefix} ${type.color}${type.icon} ${type.name}${colors.reset}${bg}${style} - ${type.description}${colors.reset}`);
		});
		console.log();
	}

	// Handle keyboard input
	handleKeyPress(key) {
		switch (key) {
		case '\u0003': // Ctrl+C
			this.exit();
			break;
		case '\u001b[A': // Up arrow
			this.selectedIndex = Math.max(0, this.selectedIndex - 1);
			this.refresh();
			break;
		case '\u001b[B': // Down arrow
			this.selectedIndex = Math.min(commitTypes.length - 1, this.selectedIndex + 1);
			this.refresh();
			break;
		case '\r': // Enter
		case ' ': // Space
			this.executeCommit();
			break;
		default:
			// Handle number keys
			const num = parseInt(key);
			if (!isNaN(num) && num >= 1 && num <= commitTypes.length) {
				this.selectedIndex = num - 1;
				this.executeCommit();
			}
			break;
		}
	}

	// Refresh the display
	refresh() {
		console.clear();
		this.showGreeting();
		this.showMenu();
	}

	// Execute the git commit
	async executeCommit() {
		const selectedType = commitTypes[this.selectedIndex];

		console.log(`${colors.bright}${colors.green}Executing commit with type: ${selectedType.name}${colors.reset}`);
		console.log();

		try {
			// Show git add command
			console.log(`${colors.dim}Running: git add .${colors.reset}`);
			execSync('git add .', { stdio: 'inherit' });

			// Show git commit command
			console.log(`${colors.dim}Running: git commit -m "${selectedType.name}"${colors.reset}`);
			execSync(`git commit -m "${selectedType.name}"`, { stdio: 'inherit' });

			console.log();
			console.log(`${colors.bright}${colors.green}✅ Commit successful!${colors.reset}`);

		} catch (error) {
			console.log();
			console.log(`${colors.bright}${colors.red}❌ Commit failed:${colors.reset}`);
			console.log(`${colors.red}${error.message}${colors.reset}`);
		}

		this.exit();
	}

	// Clean exit
	exit() {
		console.log();
		console.log(`${colors.dim}Goodbye! 👋${colors.reset}`);
		stdin.setRawMode(false);
		this.rl.close();
		process.exit(0);
	}

	// Start the script
	run() {
		this.showGreeting();
		this.showMenu();

		stdin.on('data', (key) => {
			this.handleKeyPress(key);
		});

		// Handle process termination
		process.on('SIGINT', () => {
			this.exit();
		});
	}
}

// Run the script
const script = new CommitScript();
script.run();
