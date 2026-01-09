<script lang="ts">
  import VideoPlayer from '$lib/components/video-player.svelte';

  interface Props {
    type: 'video' | 'audio';
    url: string;
    thumbnailUrl?: string;
    metadata?: any;
  }

  let { type, url, thumbnailUrl, metadata }: Props = $props();
</script>

<div class="mt-2 rounded-lg overflow-hidden border bg-black/5 max-w-sm">
  {#if type === 'video'}
    <VideoPlayer src={url} />
  {:else}
    <div class="p-3 flex items-center gap-3 bg-muted/50">
      <audio src={url} controls class="w-full h-8"></audio>
    </div>
  {/if}
</div>
