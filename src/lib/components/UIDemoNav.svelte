<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	
	const demos = [
		{ href: '/func/ui', label: 'Overview' },
		{ href: '/func/ui/basic', label: 'Basic' },
		{ href: '/func/ui/absolute', label: 'Absolute' },
		{ href: '/func/ui/stack', label: 'Stack' },
		{ href: '/func/ui/flex', label: 'Flex' },
		{ href: '/func/ui/text', label: 'Text' }
	];
</script>

<nav class="ui-demo-nav">
	{#each demos as demo}
		<a 
			href="{base}{demo.href}" 
			class:active={$page.url.pathname === demo.href}
		>
			{demo.label}
		</a>
	{/each}
</nav>

<style>
	.ui-demo-nav {
		display: flex;
		gap: 10px;
		padding: 15px 20px;
		background-color: #f8f9fa;
		border-bottom: 1px solid #dee2e6;
		flex-wrap: wrap;
	}
	
	.ui-demo-nav a {
		padding: 8px 16px;
		text-decoration: none;
		color: #495057;
		background-color: white;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		transition: all 0.2s ease;
		font-size: 14px;
	}
	
	.ui-demo-nav a:hover {
		background-color: #e9ecef;
		border-color: #adb5bd;
	}
	
	.ui-demo-nav a.active {
		background-color: #007bff;
		color: white;
		border-color: #007bff;
	}
</style>