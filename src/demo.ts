// Demo entry point for Timeline functionality
console.log('Fantoccini Timeline Demo');

// Simple animation demo
function initDemo(): void {
	const box = document.getElementById('box') as HTMLDivElement;
	const playBtn = document.getElementById('play-animation') as HTMLButtonElement;
	const resetBtn = document.getElementById('reset-animation') as HTMLButtonElement;
	
	let animationId: number | null = null;
	
	playBtn.addEventListener('click', () => {
		if (animationId) return; // Already playing
		
		const startTime = performance.now();
		const duration = 2000; // 2 seconds
		const startX = 0;
		const endX = 700;
		
		function animate(currentTime: number): void {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);
			
			// Easing function (ease-in-out)
			const eased = progress < 0.5
				? 2 * progress * progress
				: 1 - Math.pow(-2 * progress + 2, 2) / 2;
			
			const currentX = startX + (endX - startX) * eased;
			box.style.left = `${currentX}px`;
			
			if (progress < 1) {
				animationId = requestAnimationFrame(animate);
			} else {
				animationId = null;
			}
		}
		
		animationId = requestAnimationFrame(animate);
	});
	
	resetBtn.addEventListener('click', () => {
		if (animationId) {
			cancelAnimationFrame(animationId);
			animationId = null;
		}
		box.style.left = '0px';
	});
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initDemo);
} else {
	initDemo();
}