<script lang="ts">
	let clickCount = 0;
	
	function handleClick() {
		clickCount++;
		console.log('Button clicked, count:', clickCount);
	}
</script>

<h1>Simple Test Page</h1>
<button on:click={handleClick}>
	Click Me ({clickCount})
</button>

<style>
	button {
		background: red;
		color: white;
		padding: 20px;
		font-size: 18px;
		margin: 20px;
	}
</style>