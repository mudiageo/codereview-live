<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import File from '@lucide/svelte/icons/file';
  import Folder from '@lucide/svelte/icons/folder';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Search from '@lucide/svelte/icons/search';
  
  interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    additions: number;
    deletions: number;
    children?: FileNode[];
    expanded?: boolean;
  }
  
  interface Props {
    files: FileNode[];
    currentFile?: string;
    onFileSelect: (path: string) => void;
  }
  
  let { files = [], currentFile = '', onFileSelect }: Props = $props();
  
  let searchQuery = $state('');
  let expandedDirs = $state<Set<string>>(new Set());
  
  const totalAdditions = $derived(
    files.reduce((sum, file) => sum + (file.additions || 0), 0)
  );
  
  const totalDeletions = $derived(
    files.reduce((sum, file) => sum + (file.deletions || 0), 0)
  );
  
  const filteredFiles = $derived(
    searchQuery.trim()
      ? filterFiles(files, searchQuery.toLowerCase())
      : files
  );
  
  function filterFiles(nodes: FileNode[], query: string): FileNode[] {
    return nodes.filter(node => {
      if (node.type === 'file') {
        return node.name.toLowerCase().includes(query) || 
               node.path.toLowerCase().includes(query);
      }
      return true;
    });
  }
  
  function toggleDirectory(path: string) {
    if (expandedDirs.has(path)) {
      expandedDirs.delete(path);
    } else {
      expandedDirs.add(path);
    }
    expandedDirs = expandedDirs; // Trigger reactivity
  }
  
  function getFileIcon(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconClass = 'w-4 h-4';
    
    switch (ext) {
      case 'js':
      case 'jsx':
        return { class: `${iconClass} text-yellow-500`, component: File };
      case 'ts':
      case 'tsx':
        return { class: `${iconClass} text-blue-500`, component: File };
      case 'py':
        return { class: `${iconClass} text-green-500`, component: File };
      case 'go':
        return { class: `${iconClass} text-cyan-500`, component: File };
      case 'rs':
        return { class: `${iconClass} text-orange-500`, component: File };
      default:
        return { class: `${iconClass} text-muted-foreground`, component: File };
    }
  }
</script>

<div class="flex h-full flex-col border-r bg-background">
  <!-- Header -->
  <div class="border-b p-3">
    <div class="mb-2 flex items-center justify-between">
      <h3 class="text-sm font-semibold">Files Changed</h3>
      <Badge variant="secondary" class="text-xs">
        {files.length}
      </Badge>
    </div>
    
    <div class="flex gap-2 text-xs text-muted-foreground">
      <span class="text-green-600">+{totalAdditions}</span>
      <span class="text-red-600">-{totalDeletions}</span>
    </div>
    
    <!-- Search -->
    <div class="relative mt-2">
      <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Filter files..."
        class="h-8 pl-8 text-xs"
        bind:value={searchQuery}
      />
    </div>
  </div>
  
  <!-- File Tree -->
  <div class="flex-1 overflow-y-auto p-2">
    {#each filteredFiles as node}
      {#if node.type === 'directory'}
        <div class="mb-1">
          <button
            type="button"
            class="flex w-full items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent"
            onclick={() => toggleDirectory(node.path)}
          >
            {#if expandedDirs.has(node.path)}
              <ChevronDown class="h-4 w-4" />
              <FolderOpen class="h-4 w-4 text-muted-foreground" />
            {:else}
              <ChevronRight class="h-4 w-4" />
              <Folder class="h-4 w-4 text-muted-foreground" />
            {/if}
            <span class="truncate">{node.name}</span>
          </button>
          
          {#if expandedDirs.has(node.path) && node.children}
            <div class="ml-4">
              {#each node.children as child}
                <button
                  type="button"
                  class="flex w-full items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent"
                  class:bg-accent={currentFile === child.path}
                  onclick={() => onFileSelect(child.path)}
                >
                  {@const icon = getFileIcon(child.name)}
                  <svelte:component this={icon.component} class={icon.class} />
                  <span class="flex-1 truncate text-left">{child.name}</span>
                  {#if child.additions || child.deletions}
                    <span class="flex gap-1 text-xs">
                      {#if child.additions > 0}
                        <span class="text-green-600">+{child.additions}</span>
                      {/if}
                      {#if child.deletions > 0}
                        <span class="text-red-600">-{child.deletions}</span>
                      {/if}
                    </span>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <button
          type="button"
          class="flex w-full items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent"
          class:bg-accent={currentFile === node.path}
          onclick={() => onFileSelect(node.path)}
        >
          {@const icon = getFileIcon(node.name)}
          <svelte:component this={icon.component} class={icon.class} />
          <span class="flex-1 truncate text-left">{node.name}</span>
          {#if node.additions || node.deletions}
            <span class="flex gap-1 text-xs">
              {#if node.additions > 0}
                <span class="text-green-600">+{node.additions}</span>
              {/if}
              {#if node.deletions > 0}
                <span class="text-red-600">-{node.deletions}</span>
              {/if}
            </span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>
  
  <!-- Keyboard Shortcuts Hint -->
  <div class="border-t p-2 text-xs text-muted-foreground">
    <div class="flex items-center justify-between">
      <span>j/k to navigate</span>
      <span>t to toggle</span>
    </div>
  </div>
</div>
