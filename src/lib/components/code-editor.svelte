<script lang="ts">
  import { Textarea } from '$lib/components/ui/textarea';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import Copy from '@lucide/svelte/icons/copy';
  import Check from '@lucide/svelte/icons/check';
  
  interface Props {
    value?: string;
    language?: string;
    readonly?: boolean;
    showLineNumbers?: boolean;
    class?: string;
  }
  
  let {
    value = $bindable(''),
    language = 'javascript',
    readonly = false,
    showLineNumbers = true,
    class: className = ''
  }: Props = $props();
  
  let copied = $state(false);
  
  const lines = $derived(value.split('\n'));
  
  async function copyToClipboard() {
    await navigator.clipboard.writeText(value);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }
</script>

<div class="relative rounded-lg border bg-code-bg {className}">
  <!-- Header -->
  <div class="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
    <Badge variant="secondary" class="text-xs font-mono">
      {language}
    </Badge>
    
    <Button
      variant="ghost"
      size="sm"
      class="h-7 gap-2"
      onclick={copyToClipboard}
    >
      {#if copied}
        <Check class="h-3 w-3" />
        Copied
      {:else}
        <Copy class="h-3 w-3" />
        Copy
      {/if}
    </Button>
  </div>
  
  <!-- Editor -->
  <div class="flex">
    {#if showLineNumbers}
      <div class="select-none border-r bg-muted/20 px-4 py-4 text-right font-mono text-sm text-muted-foreground">
        {#each lines as _, i}
          <div class="leading-6">{i + 1}</div>
        {/each}
      </div>
    {/if}
    
    <div class="flex-1 overflow-x-auto">
      {#if readonly}
        <pre class="p-4 font-mono text-sm leading-6"><code>{value}</code></pre>
      {:else}
        <Textarea
          bind:value
          class="min-h-[400px] resize-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0"
          placeholder="Paste your code here..."
        />
      {/if}
    </div>
  </div>
</div>
