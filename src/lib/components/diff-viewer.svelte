<script lang="ts">
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { LanguageDetector } from '$lib/utils/language-detector';
  import GitCompare from '@lucide/svelte/icons/git-compare';
  import Copy from '@lucide/svelte/icons/copy';
  import AlertCircle from '@lucide/svelte/icons/alert-circle';
  import Lightbulb from '@lucide/svelte/icons/lightbulb';
  import Shield from '@lucide/svelte/icons/shield';
  import Zap from '@lucide/svelte/icons/zap';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import { toast } from 'svelte-sonner';
  import type { CodeAnalysis } from '$lib/server/ai';

  interface Props {
    diff: string;
    filename?: string;
    viewMode?: 'unified' | 'split';
    onLineClick?: (lineNumber: number) => void;
    aiAnalysis?: CodeAnalysis;
    onExplainCode?: (lineNumber: number, code: string) => void;
    onscroll?: (e: Event) => void;
  }

  let { diff, filename = 'changes.diff', viewMode = $bindable('unified'), onLineClick, aiAnalysis, onExplainCode, onscroll }: Props = $props();

  let viewport = $state<HTMLElement | null>(null);

  $effect(() => {
    if (viewport && onscroll) {
      viewport.addEventListener('scroll', onscroll);
      return () => viewport.removeEventListener('scroll', onscroll);
    }
  });

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

  // Get AI analysis items for a specific line
  interface LineAnnotation {
    type: 'bug' | 'security' | 'suggestion' | 'performance' | 'smell';
    severity?: string;
    impact?: string;
    description: string;
    item: {
      description: string;
      suggestion?: string;
      recommendation?: string;
      [key: string]: any;
    };
  }

  function getLineAnnotations(lineNumber: number): LineAnnotation[] {
    if (!aiAnalysis) return [];

    const annotations: LineAnnotation[] = [];

    // Check bugs
    aiAnalysis.bugs?.forEach((bug) => {
      if (bug.line === lineNumber) {
        annotations.push({ type: 'bug', severity: bug.severity, description: bug.description, item: bug });
      }
    });

    // Check security issues (may not have line numbers)
    aiAnalysis.securityIssues?.forEach((issue) => {
      if ('line' in issue && issue.line === lineNumber) {
        annotations.push({ type: 'security', severity: issue.severity, description: issue.description, item: issue });
      }
    });

    // Check suggestions
    aiAnalysis.suggestions?.forEach((suggestion) => {
      if (suggestion.line === lineNumber) {
        annotations.push({ type: 'suggestion', impact: suggestion.impact, description: suggestion.description, item: suggestion });
      }
    });

    // Check performance notes
    aiAnalysis.performanceNotes?.forEach((note) => {
      if (note.line === lineNumber) {
        annotations.push({
          type: 'performance',
          impact: note.impact,
          description: note.description,
          item: note
        });
      }
    });

    // Check code smells
    aiAnalysis.codeSmells?.forEach((smell) => {
      if (smell.line === lineNumber) {
        annotations.push({ type: 'smell', description: smell.description, item: smell });
      }
    });

    return annotations;
  }

  function getAnnotationIcon(type: string) {
    switch (type) {
      case 'bug':
        return AlertCircle;
      case 'security':
        return Shield;
      case 'suggestion':
        return Lightbulb;
      case 'performance':
      case 'smell':
        return Zap;
      default:
        return AlertCircle;
    }
  }

  function getAnnotationColor(annotations: LineAnnotation[]) {
    // Use the most severe annotation color
    const hasCritical = annotations.some(a => a.severity === 'critical' || a.severity === 'high');
    const hasHighImpact = annotations.some(a => a.impact === 'high');

    if (hasCritical) return 'text-destructive';
    if (hasHighImpact) return 'text-orange-500';
    return 'text-blue-500';
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
    <ScrollArea class="h-[600px]" bind:viewportRef={viewport}>
      {#if viewMode === 'unified'}
        <!-- Unified View -->
        <div class="font-mono text-xs">
          {#each parsedDiff() as line, i (i)}
            {@const annotations = line.lineNumber?.new ? getLineAnnotations(line.lineNumber.new) : []}
            <div class="flex {getLineClass(line.type)} relative group">
              <button
                class="w-16 flex-shrink-0 text-center text-muted-foreground/60 border-r px-2 py-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                onclick={() => onLineClick && line.lineNumber?.new && onLineClick(line.lineNumber.new)}
                type="button"
              >
                {#if line.lineNumber}
                  <span class="inline-block w-8 text-right">
                    {line.lineNumber.old || ''}
                  </span>
                  <span class="inline-block w-8 text-right">
                    {line.lineNumber.new || ''}
                  </span>
                {/if}
              </button>
              <div class="flex-1 px-4 py-1 whitespace-pre-wrap break-all flex items-center justify-between">
                <div class="flex-1">
                  <span class="opacity-60">{getLinePrefix(line.type)}</span>{line.content}
                </div>
                <div class="flex items-center gap-1">
                  {#if annotations.length > 0}
                    <Popover>
                      <PopoverTrigger>
                        {#snippet child(props)}
                          <button
                            {...props}
                            type="button"
                            class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity {getAnnotationColor(annotations)}"
                          >
                            {#each annotations as annotation}
                              {@const Icon = getAnnotationIcon(annotation.type)}
                              <Icon class="h-4 w-4 inline-block ml-1" />
                            {/each}
                          </button>
                        {/snippet}
                      </PopoverTrigger>
                      <PopoverContent class="w-80">
                        <div class="space-y-3">
                          {#each annotations as annotation}
                                {@const Icon = getAnnotationIcon(annotation.type)}
                            <div class="text-sm">
                              <div class="flex items-center gap-2 mb-1">
                                <Icon class="h-4 w-4 {getAnnotationColor(annotation)}" />
                                <span class="font-semibold capitalize {getAnnotationColor(annotation)}">
                                  {annotation.type}
                                </span>
                                {#if annotation.severity}
                                  <Badge variant="outline" class="text-xs">{annotation.severity}</Badge>
                                {/if}
                                {#if annotation.impact}
                                  <Badge variant="outline" class="text-xs">{annotation.impact}</Badge>
                                {/if}
                              </div>
                              <p class="text-muted-foreground">{annotation.description}</p>
                              {#if annotation.item.suggestion}
                                <p class="mt-1 text-xs text-muted-foreground">💡 {annotation.item.suggestion}</p>
                              {/if}
                            </div>
                          {/each}
                        </div>
                      </PopoverContent>
                    </Popover>
                  {/if}
                  {#if onExplainCode && line.content.trim() && line.type !== 'header'}
                    <button
                      type="button"
                      class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded p-1"
                      onclick={() => line.lineNumber?.new && onExplainCode(line.lineNumber.new, line.content)}
                      title="Explain this code with AI"
                    >
                      <Sparkles class="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </button>
                  {/if}
                </div>
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
                {@const annotations = line.lineNumber?.old ? getLineAnnotations(line.lineNumber.old) : []}
                <div class="flex {getLineClass(line.type)} relative group">
                  <button
                    class="w-12 flex-shrink-0 text-center text-muted-foreground/60 border-r px-2 py-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                    onclick={() => onLineClick && line.lineNumber?.old && onLineClick(line.lineNumber.old)}
                    type="button"
                  >
                    {line.lineNumber?.old || ''}
                  </button>
                  <div class="flex-1 px-4 py-1 whitespace-pre-wrap break-all flex items-center justify-between">
                    <div class="flex-1">
                      <span class="opacity-60">{getLinePrefix(line.type)}</span>{line.content}
                    </div>
                    {#if onExplainCode && line.content.trim() && line.type !== 'header'}
                      <button
                        type="button"
                        class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded p-1"
                        onclick={() => line.lineNumber?.old && onExplainCode(line.lineNumber.old, line.content)}
                        title="Explain this code with AI"
                      >
                        <Sparkles class="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </button>
                    {/if}
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
                {@const annotations = line.lineNumber?.new ? getLineAnnotations(line.lineNumber.new) : []}
                <div class="flex {getLineClass(line.type)} relative group">
                  <button
                    class="w-12 flex-shrink-0 text-center text-muted-foreground/60 border-r px-2 py-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                    onclick={() => onLineClick && line.lineNumber?.new && onLineClick(line.lineNumber.new)}
                    type="button"
                  >
                    {line.lineNumber?.new || ''}
                  </button>
                  <div class="flex-1 px-4 py-1 whitespace-pre-wrap break-all flex items-center justify-between">
                    <div class="flex-1">
                      <span class="opacity-60">{getLinePrefix(line.type)}</span>{line.content}
                    </div>
                    {#if onExplainCode && line.content.trim() && line.type !== 'header'}
                      <button
                        type="button"
                        class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded p-1"
                        onclick={() => line.lineNumber?.new && onExplainCode(line.lineNumber.new, line.content)}
                        title="Explain this code with AI"
                      >
                        <Sparkles class="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </button>
                    {/if}
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
