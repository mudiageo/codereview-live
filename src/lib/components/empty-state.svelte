<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import type { ComponentType } from 'svelte';
  
  interface Props {
    icon: ComponentType;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
  }
  
  let { icon, title, description, actionLabel, actionHref, onAction }: Props = $props();
</script>

<Card>
  <CardContent class="flex flex-col items-center justify-center p-12 text-center">
    <div class="rounded-full bg-muted p-4 mb-4">
      <svelte:component this={icon} class="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 class="text-lg font-semibold mb-2">{title}</h3>
    <p class="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
    {#if actionLabel}
      {#if actionHref}
        <Button href={actionHref}>{actionLabel}</Button>
      {:else}
        <Button onclick={onAction}>{actionLabel}</Button>
      {/if}
    {/if}
  </CardContent>
</Card>