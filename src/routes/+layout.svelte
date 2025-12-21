<script lang="ts">
 import { ModeWatcher } from "mode-watcher";
	import './layout.css';
	import '$lib/styles/animations.css';
	import favicon from '$lib/assets/favicon.svg';
  import { onNavigate } from '$app/navigation';
    
  let { children } = $props();

  // Enable View Transitions API for smooth page navigation
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;
    
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

</script>
 
<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
{@render children()}
