<script lang="ts">
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
  import { Skeleton } from '$lib/components/ui/skeleton';
  
  interface Props {
    type?: 'card' | 'list' | 'table';
    count?: number;
  }
  
  let { type = 'card', count = 3 }: Props = $props();
</script>

{#if type === 'card'}
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {#each Array(count) as _}
      <Card>
        <Skeleton class="aspect-video w-full" />
        <CardHeader>
          <Skeleton class="h-4 w-3/4 mb-2" />
          <Skeleton class="h-3 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton class="h-3 w-full mb-2" />
          <Skeleton class="h-3 w-2/3" />
        </CardContent>
      </Card>
    {/each}
  </div>
{:else if type === 'list'}
  <div class="space-y-2">
    {#each Array(count) as _}
      <Card>
        <CardContent class="flex items-center gap-4 p-4">
          <Skeleton class="h-10 w-10 rounded-full" />
          <div class="flex-1 space-y-2">
            <Skeleton class="h-4 w-1/2" />
            <Skeleton class="h-3 w-1/3" />
          </div>
        </CardContent>
      </Card>
    {/each}
  </div>
{:else}
  <Card>
    <CardContent class="p-0">
      {#each Array(count) as _}
        <div class="flex items-center gap-4 p-4 border-b last:border-0">
          <Skeleton class="h-4 w-1/4" />
          <Skeleton class="h-4 w-1/4" />
          <Skeleton class="h-4 w-1/4" />
          <Skeleton class="h-8 w-20" />
        </div>
      {/each}
    </CardContent>
  </Card>
{/if}