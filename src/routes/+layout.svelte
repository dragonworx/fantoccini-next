<script lang="ts">
    import "../app.css";
</script>

<div class="app">
    <header>
        <nav>
            <a href="/">Home</a>
        </nav>

        <nav>
            <a href="/test/metronome">Test / Metronome</a>
        </nav>
    </header>

    <main>
        <slot />
    </main>

    <footer>
        <p>
            &copy; 2025 Ali Chamas <a href="github/dragonworx"
                >github/dragonworx</a
            >
        </p>
    </footer>
</div>

<style>
    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
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
        color: #aaa;
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
