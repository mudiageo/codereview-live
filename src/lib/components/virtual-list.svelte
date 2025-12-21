<script lang="ts" generics="T">
	import { createVirtualScroller } from '$lib/utils/virtual-scroll';
	import { onMount } from 'svelte';

	let {
		items,
		itemHeight,
		containerHeight = 600,
		overscan = 3,
		children
	}: {
		items: T[];
		itemHeight: number;
		containerHeight?: number;
		overscan?: number;
		children: (item: T, index: number) => any;
	} = $props();

	let scrollContainer: HTMLDivElement;
	let scrollTop = $state(0);

	const scroller = $derived(
		createVirtualScroller({
			items,
			itemHeight,
			containerHeight,
			overscan
		})
	);

	const virtualData = $derived(scroller.getVisibleItems(scrollTop));
	const totalHeight = $derived(scroller.getTotalHeight());

	function handleScroll(event: Event) {
		const target = event.target as HTMLDivElement;
		scrollTop = target.scrollTop;
	}

	// Update items when they change
	$effect(() => {
		scroller.updateItems(items);
	});
</script>

<div
	bind:this={scrollContainer}
	class="virtual-scroll-container overflow-auto"
	style="height: {containerHeight}px"
	onscroll={handleScroll}
>
	<div class="relative" style="height: {totalHeight}px">
		<div
			class="absolute top-0 left-0 right-0"
			style="transform: translateY({virtualData.offsetY}px)"
		>
			{#each virtualData.visibleItems as item, index}
				<div class="virtual-item" style="height: {itemHeight}px">
					{@render children(item, virtualData.start + index)}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.virtual-scroll-container {
		overflow-y: auto;
		position: relative;
	}

	.virtual-item {
		overflow: hidden;
	}
</style>
