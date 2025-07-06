<script lang="ts">
	import '../app.css';
</script>

<div class="app">
	<header>
		<nav>
			<a href="/">Home</a>
		</nav>
	</header>

	<main>
		<slot />
	</main>

	<footer>
		<p>&copy; 2024 SvelteKit App</p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		background-color: #f8f9fa;
		padding: 1rem;
		border-bottom: 1px solid #e9ecef;
	}

	nav a {
		color: #333;
		text-decoration: none;
		font-weight: 500;
	}

	nav a:hover {
		color: #ff3e00;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	footer {
		background-color: #f8f9fa;
		padding: 1rem;
		border-top: 1px solid #e9ecef;
		text-align: center;
		color: #666;
	}
</style>