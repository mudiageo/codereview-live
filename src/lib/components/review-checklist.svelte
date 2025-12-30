<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import Check from '@lucide/svelte/icons/check';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Shield from '@lucide/svelte/icons/shield';
  import Zap from '@lucide/svelte/icons/zap';
  import CheckSquare from '@lucide/svelte/icons/check-square';
  import Code from '@lucide/svelte/icons/code';
  import Server from '@lucide/svelte/icons/server';
  import Info from '@lucide/svelte/icons/info';
  import { checklistTemplates, getTemplate, type ChecklistItem, type ChecklistTemplate } from '$lib/config/checklist-templates';
  import { toast } from 'svelte-sonner';
  
  interface Props {
    selectedTemplate?: string;
    checkedItems?: Record<string, boolean>;
    aiNotes?: Record<string, string>;
    onCheckChange?: (id: string, checked: boolean) => void;
    onTemplateChange?: (templateId: string) => void;
    onAutoCheck?: () => void;
    loading?: boolean;
    disabled?: boolean;
  }

  let { 
    selectedTemplate = 'general',
    checkedItems = $bindable({}),
    aiNotes = {},
    onCheckChange,
    onTemplateChange,
    onAutoCheck,
    loading = false,
    disabled = false,
  }: Props = $props();

  const template = $derived(getTemplate(selectedTemplate));
  
  const progress = $derived.by(() => {
    if (!template) return 0;
    const total = template.items.length;
    const checked = template.items.filter(item => checkedItems[item.id]).length;
    return Math.round((checked / total) * 100);
  });

  const checkedCount = $derived.by(() => {
    if (!template) return 0;
    return template.items.filter(item => checkedItems[item.id]).length;
  });

  function handleCheck(id: string, checked: boolean) {
    checkedItems = { ...checkedItems, [id]: checked };
    onCheckChange?.(id, checked);
  }

  function handleTemplateChange(value: string) {
    // Reset checked items when template changes
    const newTemplate = getTemplate(value);
    if (newTemplate) {
      const newChecked: Record<string, boolean> = {};
      newTemplate.items.forEach(item => {
        newChecked[item.id] = false;
      });
      checkedItems = newChecked;
    }
    onTemplateChange?.(value);
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case 'security': return 'bg-red-500/10 text-red-500';
      case 'performance': return 'bg-yellow-500/10 text-yellow-500';
      case 'logic': return 'bg-blue-500/10 text-blue-500';
      case 'style': return 'bg-purple-500/10 text-purple-500';
      case 'testing': return 'bg-green-500/10 text-green-500';
      default: return 'bg-muted text-muted-foreground';
    }
  }

  function getTemplateIcon(id: string) {
    switch (id) {
      case 'security': return Shield;
      case 'performance': return Zap;
      case 'general': return CheckSquare;
      case 'frontend': return Code;
      case 'api': return Server;
      default: return CheckSquare;
    }
  }
</script>

<Card class="overflow-hidden">
  <CardHeader class="pb-3">
    <div class="flex items-center justify-between gap-4">
      <CardTitle class="text-lg flex items-center gap-2">
        <CheckSquare class="h-5 w-5 text-primary" />
        Review Checklist
      </CardTitle>
      
      <Select type="single" value={selectedTemplate} onValueChange={handleTemplateChange}>
        <SelectTrigger class="w-[180px] h-9">
          <div class="flex items-center gap-2">
            {#if template}
              <span>{template.icon}</span>
              <span>{template.name}</span>
            {:else}
              Select template
            {/if}
          </div>
        </SelectTrigger>
        <SelectContent>
          {#each checklistTemplates as t}
            <SelectItem value={t.id}>
              <div class="flex items-center gap-2">
                <span>{t.icon}</span>
                <span>{t.name}</span>
              </div>
            </SelectItem>
          {/each}
        </SelectContent>
      </Select>
    </div>
    
    {#if template}
      <p class="text-sm text-muted-foreground mt-1">{template.description}</p>
    {/if}
  </CardHeader>

  <CardContent class="space-y-4">
    {#if loading}
      <!-- Loading State -->
      <div class="space-y-3">
        {#each Array(5) as _}
          <div class="flex items-center gap-3 p-2">
            <Skeleton class="h-4 w-4 rounded" />
            <Skeleton class="h-4 flex-1" />
            <Skeleton class="h-5 w-16 rounded-full" />
          </div>
        {/each}
      </div>
    {:else if template}
      <!-- Progress Bar -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">Progress</span>
          <span class="font-medium">{checkedCount()}/{template.items.length} items</span>
        </div>
        <Progress value={progress()} class="h-2" />
        
        {#if progress() === 100}
          <div class="flex items-center gap-2 text-sm text-green-500">
            <Check class="h-4 w-4" />
            <span>All items checked!</span>
          </div>
        {/if}
      </div>

      <!-- AI Auto-check Button -->
      {#if onAutoCheck}
        <Button 
          variant="outline" 
          size="sm" 
          class="w-full gap-2 border-dashed"
          onclick={onAutoCheck}
          disabled={disabled}
        >
          <Sparkles class="h-4 w-4" />
          Auto-check with AI
        </Button>
      {/if}

      <!-- Checklist Items -->
      <div class="space-y-1">
        {#each template.items as item}
          {@const isChecked = checkedItems[item.id] || false}
          {@const hasNote = !!aiNotes[item.id]}
          
          <div 
            class="group relative flex items-start gap-3 p-3 rounded-lg border transition-all hover:bg-muted/30"
            class:bg-green-500/5={isChecked}
            class:border-green-500/30={isChecked}
          >
            <Checkbox
              id={item.id}
              checked={isChecked}
              onCheckedChange={(checked) => handleCheck(item.id, checked as boolean)}
              disabled={disabled}
              class="mt-0.5"
            />
            
            <div class="flex-1 min-w-0 space-y-1">
              <label 
                for={item.id}
                class="text-sm font-medium cursor-pointer select-none"
                class:line-through={isChecked}
                class:text-muted-foreground={isChecked}
              >
                {item.text}
              </label>
              
              {#if item.description}
                <p class="text-xs text-muted-foreground">{item.description}</p>
              {/if}
              
              {#if hasNote}
                <div class="flex items-start gap-1 text-xs text-blue-500 mt-1">
                  <Info class="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{aiNotes[item.id]}</span>
                </div>
              {/if}
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <Badge variant="outline" class={`text-xs ${getCategoryColor(item.category)}`}>
                {item.category}
              </Badge>
              
              {#if item.autoCheck}
                <Badge variant="outline" class="text-xs bg-primary/10 text-primary">
                  <Sparkles class="h-2.5 w-2.5 mr-1" />
                  AI
                </Badge>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <!-- Summary -->
      <div class="flex items-center justify-between text-sm pt-2 border-t">
        <span class="text-muted-foreground">
          {template.items.filter(i => i.autoCheck).length} items can be auto-checked by AI
        </span>
      </div>
    {:else}
      <div class="text-center py-8 text-muted-foreground">
        <CheckSquare class="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Select a checklist template to get started</p>
      </div>
    {/if}
  </CardContent>
</Card>
</script>
