<script lang="ts">
	const name: string = 'SvelteKit';
	let count: number = 0;

	function increment(): void {
		count += 1;
	}

	function decrement(): void {
		count -= 1;
	}

	function reset(): void {
		count = 0;
	}
</script>

<svelte:head>
	<title>Welcome to {name}</title>
	<meta name="description" content="SvelteKit app with TypeScript" />
</svelte:head>

<section>
	<h1>Welcome to {name}!</h1>

	<p>This is your SvelteKit app with TypeScript support.</p>

	<div class="counter">
		<h2>Counter: {count}</h2>
		<div class="buttons">
			<button on:click={decrement}>-</button>
			<button on:click={reset}>Reset</button>
			<button on:click={increment}>+</button>
		</div>
	</div>

	<div class="info">
		<p>
			Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
		</p>
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
		padding: 2rem;
		text-align: center;
	}

	h1 {
		width: 100%;
		color: #ff3e00;
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.counter {
		margin: 2rem 0;
	}

	.counter h2 {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	.buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	button {
		background-color: #ff3e00;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		min-width: 60px;
	}

	button:hover {
		background-color: #cc3300;
	}

	.info {
		margin-top: 2rem;
	}

	a {
		color: #ff3e00;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
