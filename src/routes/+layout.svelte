<script lang="ts">
	import '../app.css';
</script>

<div class="app">
	<header>
		<nav>
			<a href="/">Home</a>
		</nav>

		<nav>
			<a href="/test/metronome">Test / Metronome</a>
		</nav>

		<nav>
			<a href="/test/sprite">Test / Sprite</a>
		</nav>
	</header>

	<main>
		<slot />
	</main>

	<footer>
		<p>
			&copy; 2025 Fantoccini - Ali Chamas <a
				href="https://github.com/dragonworx">github/dragonworx</a
			> - all rights reserved.
		</p>
	</footer>
</div>

<style>
    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        box-shadow: 10px 10px 32px 0 rgba(0, 0, 0, 0.35);
    }

    header {
        display: flex;
        background-color: #333;
        border-bottom: 1px solid #555;
    }

    nav {
        display: iinline-block;
        padding: 5px;
        border: 1px solid #555;
        background-color: #222;
        border-radius: 5px;
        margin: 5px;
        margin-right: 5px;
    }

    nav a {
        color: lightskyblue;
        text-decoration: none;
        font-weight: 500;
    }

    nav a:hover {
        color: #aaa;
    }

    main {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    footer {
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #181c24;
        border-top: 1px solid #505050;
        text-align: center;
        color: #666;
    }
</style>
