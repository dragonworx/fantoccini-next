<script lang="ts">
	import { base } from '$app/paths';
	import UIDemoNav from '$lib/components/UIDemoNav.svelte';
</script>

<UIDemoNav />
<div class="demo-index">
	<h1>UI Library Demos</h1>
	<p>Explore the various UI components and layout systems available in Fantoccini.</p>
	
	<div class="demo-grid">
		<a href="{base}/func/ui/basic" class="demo-card">
			<h3>Basic Rectangle</h3>
			<p>The simplest demo - rendering a single colored rectangle</p>
		</a>
		
		<a href="{base}/func/ui/absolute" class="demo-card">
			<h3>Absolute Positioning</h3>
			<p>Position elements absolutely within containers</p>
		</a>
		
		<a href="{base}/func/ui/stack" class="demo-card">
			<h3>Stack Layout</h3>
			<p>Automatic vertical and horizontal stacking of elements</p>
		</a>
		
		<a href="{base}/func/ui/flex" class="demo-card">
			<h3>Flex Layout</h3>
			<p>Flexible box layouts with alignment and distribution</p>
		</a>
		
		<a href="{base}/func/ui/text" class="demo-card">
			<h3>Text Rendering</h3>
			<p>Text with various fonts, sizes, colors, and styles</p>
		</a>
	</div>
</div>

<style>
	.demo-index {
		padding: 40px 20px;
		max-width: 1200px;
		margin: 0 auto;
	}
	
	h1 {
		color: #333;
		margin-bottom: 10px;
	}
	
	.demo-index > p {
		color: #666;
		font-size: 1.1rem;
		margin-bottom: 40px;
	}
	
	.demo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 20px;
	}
	
	.demo-card {
		display: block;
		padding: 25px;
		background: white;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.demo-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border-color: #007bff;
	}
	
	.demo-card h3 {
		margin: 0 0 10px 0;
		color: #333;
		font-size: 1.3rem;
	}
	
	.demo-card p {
		margin: 0;
		color: #666;
		line-height: 1.5;
	}
</style>