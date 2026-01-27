<script lang="ts">
	import { ModeWatcher, setMode, resetMode } from 'mode-watcher';
	import './layout.css';
	import '$lib/styles/animations.css';
	import favicon from '$lib/assets/icon.svg';
	import { onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { settingsStore } from '$lib/stores/index.svelte';
	import { CSS_VARS } from '$lib/constants';
	import { Ssgoi } from '@ssgoi/svelte';
	import { transitionConfig } from '$lib/config/transitions';

	let { children } = $props();

	// Apply settings on mount and when they change
	onMount(() => {
		// Apply theme
		const theme = settingsStore.settings.theme;
		if (theme === 'system') {
			resetMode();
		} else {
			setMode(theme);
		}

		// Apply font size
		applyFontSize(settingsStore.settings.fontSize);
	});

	// Watch for font size changes and apply them
	$effect(() => {
		applyFontSize(settingsStore.settings.fontSize);
	});

	function applyFontSize(size: number) {
		if (typeof document !== 'undefined') {
			document.documentElement.style.setProperty(CSS_VARS.EDITOR_FONT_SIZE, `${size}px`);
		}
	}

</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Ssgoi config={transitionConfig}>
	<div style="position: relative; min-height: 100vh;">
		{@render children()}
	</div>
</Ssgoi>
