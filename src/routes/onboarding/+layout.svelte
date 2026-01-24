<script lang="ts">
	import { page } from '$app/state';
	import { SsgoiTransition } from '@ssgoi/svelte';

	let { children } = $props();
</script>

<SsgoiTransition id={page.url.pathname}>
	{@render children()}
</SsgoiTransition>
