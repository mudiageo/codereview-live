<script lang="ts">
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { LanguageDetector } from '$lib/utils/language-detector';
  import GitCompare from '@lucide/svelte/icons/git-compare';
  import Copy from '@lucide/svelte/icons/copy';
  import { toast } from 'svelte-sonner';

  interface Props {
    diff: string;
    filename?: string;
    viewMode?: 'unified' | 'split';
  }

  let { diff, filename = 'changes.diff', viewMode = $bindable('unified') }: Props = $props();

  interface DiffLine {
    type: 'add' | 'remove' | 'context' | 'header';
    content: string;
    lineNumber?: { old?: number; new?: number };
  }

  const parsedDiff = $derived(() => {
    const lines = diff.split('\n');
    const parsed: DiffLine[] = [];
    let oldLineNum = 0;
    let newLineNum = 0;

    for (const line of lines) {
      if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
        parsed.push({ type: 'header', content: line });
        
        // Parse hunk header for line numbers
        if (line.startsWith('@@')) {
          const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
          if (match) {
            oldLineNum = parseInt(match[1]) - 1;
            newLineNum = parseInt(match[2]) - 1;
          }
        }
      } else if (line.startsWith('+')) {
        newLineNum++;
        parsed.push({
          type: 'add',
          content: line.substring(1),
          lineNumber: { new: newLineNum }
        });
      } else if (line.startsWith('-')) {
        oldLineNum++;
        parsed.push({
          type: 'remove',
          content: line.substring(1),
          lineNumber: { old: oldLineNum }
        });
      } else {
        oldLineNum++;
        newLineNum++;
        parsed.push({
          type: 'context',
          content: line.startsWith(' ') ? line.substring(1) : line,
          lineNumber: { old: oldLineNum, new: newLineNum }
        });
      }
    }

    return parsed;
  });

  const stats = $derived(() => {
    let additions = 0;
    let deletions = 0;
    
    for (const line of parsedDiff()) {
      if (line.type === 'add') additions++;
      else if (line.type === 'remove') deletions++;
    }

    return { additions, deletions, total: additions + deletions };
  });

  async function copyDiff() {
    try {
      await navigator.clipboard.writeText(diff);
      toast.success('Diff copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy diff');
    }
  }

  function getLineClass(type: DiffLine['type']) {
    switch (type) {
      case 'add':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'remove':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'header':
        return 'bg-muted/50 text-muted-foreground font-semibold';
      default:
        return '';
    }
  }

  function getLinePrefix(type: DiffLine['type']) {
    switch (type) {
      case 'add':
        return '+';
      case 'remove':
        return '-';
      case 'context':
        return ' ';
      default:
        return '';
    }
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <GitCompare class="h-5 w-5 text-muted-foreground" />
        <span class="font-mono text-sm">{filename}</span>
      </div>
      
      <div class="flex items-center gap-2">
        <Badge variant="outline" class="text-green-600">
          +{stats().additions}
        </Badge>
        <Badge variant="outline" class="text-red-600">
          -{stats().deletions}
        </Badge>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <Tabs value={viewMode} onValueChange={(v) => (viewMode = v as any)}>
        <TabsList>
          <TabsTrigger value="unified">Unified</TabsTrigger>
          <TabsTrigger value="split">Split</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Button variant="outline" size="sm" onclick={copyDiff}>
        <Copy class="h-4 w-4 mr-2" />
        Copy
      </Button>
    </div>
  </div>

  <!-- Diff Content -->
  <div class="rounded-lg border overflow-hidden">
    <ScrollArea class="h-[600px]">
      {#if viewMode === 'unified'}
        <!-- Unified View -->
        <div class="font-mono text-xs">
          {#each parsedDiff() as line, i (i)}
            <div class="flex {getLineClass(line.type)}">
              <div class="w-16 flex-shrink-0 text-center text-muted-foreground/60 border-r px-2 py-1">
                {#if line.lineNumber}
                  <span class="inline-block w-8 text-right">
                    {line.lineNumber.old || ''}
                  </span>
                  <span class="inline-block w-8 text-right">
                    {line.lineNumber.new || ''}
                  </span>
                {/if}
              </div>
              <div class="flex-1 px-4 py-1 whitespace-pre-wrap break-all">
                <span class="opacity-60">{getLinePrefix(line.type)}</span>{line.content}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <!-- Split View -->
        <div class="grid grid-cols-2 font-mono text-xs">
          <div class="border-r">
            {#each parsedDiff() as line, i (i)}
              {#if line.type !== 'add'}
                <div class="flex {getLineClass(line.type)}">
                  <div class="w-12 flex-shrink-0 text-center text-muted-foreground/60 border-r px-2 py-1">
                    {line.lineNumber?.old || ''}
                  </div>
                  <div class="flex-1 px-4 py-1 whitespace-pre-wrap break-all">
                    <span class="opacity-60">{getLinePrefix(line.type)}</span>{line.content}
                  </div>
                </div>
              {:else}
                <div class="py-1 bg-muted/20"></div>
              {/if}
            {/each}
          </div>
          
          <div>
            {#each parsedDiff() as line, i (i)}
              {#if line.type !== 'remove'}
                <div class="flex {getLineClass(line.type)}">
                  <div class="w-12 flex-shrink-0 text-center text-muted-foreground/60 border-r px-2 py-1">
                    {line.lineNumber?.new || ''}
                  </div>
                  <div class="flex-1 px-4 py-1 whitespace-pre-wrap break-all">
                    <span class="opacity-60">{getLinePrefix(line.type)}</span>{line.content}
                  </div>
                </div>
              {:else}
                <div class="py-1 bg-muted/20"></div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    </ScrollArea>
  </div>
</div>
