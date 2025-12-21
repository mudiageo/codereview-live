<script lang="ts">
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Input } from '$lib/components/ui/input';
  import CodeEditor from './code-editor.svelte';
  import DiffViewer from './diff-viewer.svelte';
  import File from '@lucide/svelte/icons/file';
  import Folder from '@lucide/svelte/icons/folder';
  import Search from '@lucide/svelte/icons/search';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import FileText from '@lucide/svelte/icons/file-text';
  import { LanguageDetector } from '$lib/utils/language-detector';

  interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    content?: string;
    language?: string;
    diff?: string;
    additions?: number;
    deletions?: number;
    children?: FileNode[];
  }

  interface Props {
    files: FileNode[];
    mode?: 'view' | 'diff';
    onFileSelect?: (file: FileNode) => void;
  }

  let { files, mode = 'view', onFileSelect }: Props = $props();

  let selectedFile = $state<FileNode | null>(null);
  let searchQuery = $state('');
  let expandedDirs = $state<Set<string>>(new Set());
  let viewMode = $state<'tree' | 'flat'>('tree');

  const languageDetector = new LanguageDetector();

  // Build tree structure from flat files
  const fileTree = $derived(() => {
    if (viewMode === 'flat') {
      return files.filter(f => 
        f.path.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const tree: FileNode[] = [];
    const nodeMap = new Map<string, FileNode>();

    // Sort files by path
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

    for (const file of sortedFiles) {
      if (searchQuery && !file.path.toLowerCase().includes(searchQuery.toLowerCase())) {
        continue;
      }

      const parts = file.path.split('/');
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!nodeMap.has(currentPath)) {
          const node: FileNode = {
            name: part,
            path: currentPath,
            type: isLast && file.type === 'file' ? 'file' : 'directory',
            children: []
          };

          if (isLast && file.type === 'file') {
            node.content = file.content;
            node.language = file.language || languageDetector.detectFromFilename(file.name);
            node.diff = file.diff;
            node.additions = file.additions;
            node.deletions = file.deletions;
          }

          nodeMap.set(currentPath, node);

          if (i === 0) {
            tree.push(node);
          } else {
            const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
            const parent = nodeMap.get(parentPath);
            if (parent && parent.children) {
              parent.children.push(node);
            }
          }
        }
      }
    }

    return tree;
  });

  const totalStats = $derived(() => {
    let additions = 0;
    let deletions = 0;
    
    for (const file of files) {
      additions += file.additions || 0;
      deletions += file.deletions || 0;
    }

    return { additions, deletions, files: files.length };
  });

  function selectFile(file: FileNode) {
    if (file.type === 'file') {
      selectedFile = file;
      onFileSelect?.(file);
    }
  }

  function toggleDirectory(path: string) {
    if (expandedDirs.has(path)) {
      expandedDirs.delete(path);
    } else {
      expandedDirs.add(path);
    }
    expandedDirs = new Set(expandedDirs);
  }

  function renderTreeNode(node: FileNode, depth = 0): any {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedFile?.path === node.path;

    if (node.type === 'directory') {
      return `
        <div class="file-tree-node">
          <button
            onclick="toggleDirectory('${node.path}')"
            class="w-full flex items-center gap-2 px-2 py-1 hover:bg-accent rounded-sm transition-colors"
            style="padding-left: ${depth * 12 + 8}px"
          >
            ${isExpanded ? '<ChevronDown class="h-4 w-4 flex-shrink-0" />' : '<ChevronRight class="h-4 w-4 flex-shrink-0" />'}
            <Folder class="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span class="text-sm">${node.name}</span>
          </button>
          ${isExpanded && node.children ? node.children.map(child => renderTreeNode(child, depth + 1)).join('') : ''}
        </div>
      `;
    } else {
      return `
        <button
          onclick="selectFile(${JSON.stringify(node)})"
          class="w-full flex items-center gap-2 px-2 py-1 hover:bg-accent rounded-sm transition-colors ${isSelected ? 'bg-accent' : ''}"
          style="padding-left: ${depth * 12 + 32}px"
        >
          <File class="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span class="text-sm flex-1 text-left">${node.name}</span>
          ${node.additions || node.deletions ? `
            <div class="flex items-center gap-1 text-xs">
              ${node.additions ? `<span class="text-green-600">+${node.additions}</span>` : ''}
              ${node.deletions ? `<span class="text-red-600">-${node.deletions}</span>` : ''}
            </div>
          ` : ''}
        </button>
      `;
    }
  }

  // Auto-select first file
  $effect(() => {
    if (!selectedFile && files.length > 0) {
      const firstFile = files.find(f => f.type === 'file');
      if (firstFile) {
        selectedFile = firstFile;
      }
    }
  });
</script>

<div class="flex h-full gap-4">
  <!-- Sidebar: File Tree -->
  <div class="w-80 flex flex-col border-r">
    <div class="p-4 space-y-4 border-b">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">Files</h3>
        <Badge variant="outline">
          {totalStats().files}
        </Badge>
      </div>

      {#if mode === 'diff'}
        <div class="flex items-center gap-2 text-xs">
          <Badge variant="outline" class="text-green-600">
            +{totalStats().additions}
          </Badge>
          <Badge variant="outline" class="text-red-600">
            -{totalStats().deletions}
          </Badge>
        </div>
      {/if}

      <div class="relative">
        <Search class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          bind:value={searchQuery}
          class="pl-8 h-8 text-sm"
        />
      </div>

      <Tabs value={viewMode} onValueChange={(v) => (viewMode = v as any)} class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="tree" class="text-xs">Tree</TabsTrigger>
          <TabsTrigger value="flat" class="text-xs">List</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    <ScrollArea class="flex-1">
      <div class="p-2">
        {#if viewMode === 'tree'}
          {#each fileTree() as node (node.path)}
            <FileTreeNode {node} {depth}={0} {isExpanded}={expandedDirs.has(node.path)} {isSelected}={selectedFile?.path === node.path} {selectFile} {toggleDirectory} />
          {/each}
        {:else}
          {#each fileTree() as file (file.path)}
            {#if file.type === 'file'}
              <button
                onclick={() => selectFile(file)}
                class="w-full flex items-center gap-2 px-2 py-1 hover:bg-accent rounded-sm transition-colors {selectedFile?.path === file.path ? 'bg-accent' : ''}"
              >
                <File class="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span class="text-sm flex-1 text-left truncate">{file.path}</span>
                {#if file.additions || file.deletions}
                  <div class="flex items-center gap-1 text-xs">
                    {#if file.additions}
                      <span class="text-green-600">+{file.additions}</span>
                    {/if}
                    {#if file.deletions}
                      <span class="text-red-600">-{file.deletions}</span>
                    {/if}
                  </div>
                {/if}
              </button>
            {/if}
          {/each}
        {/if}
      </div>
    </ScrollArea>
  </div>

  <!-- Main Content: File Viewer -->
  <div class="flex-1 flex flex-col">
    {#if selectedFile}
      <div class="p-4 border-b">
        <div class="flex items-center gap-2">
          <FileText class="h-5 w-5 text-muted-foreground" />
          <span class="font-mono text-sm">{selectedFile.path}</span>
          {#if selectedFile.language}
            <Badge variant="secondary" class="text-xs">{selectedFile.language}</Badge>
          {/if}
        </div>
      </div>

      <div class="flex-1 overflow-auto p-4">
        {#if mode === 'diff' && selectedFile.diff}
          <DiffViewer diff={selectedFile.diff} filename={selectedFile.path} />
        {:else if selectedFile.content}
          <CodeEditor
            value={selectedFile.content}
            language={selectedFile.language || 'text'}
            readonly
            showLineNumbers
          />
        {:else}
          <div class="flex items-center justify-center h-full text-muted-foreground">
            <div class="text-center">
              <FileText class="mx-auto h-12 w-12 opacity-20" />
              <p class="mt-4">No content available</p>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="flex-1 flex items-center justify-center text-muted-foreground">
        <div class="text-center">
          <Folder class="mx-auto h-12 w-12 opacity-20" />
          <p class="mt-4">Select a file to view</p>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Recursive tree node component -->
{#snippet FileTreeNode({ node, depth, isExpanded, isSelected, selectFile, toggleDirectory })}
  {#if node.type === 'directory'}
    <div class="file-tree-node">
      <button
        onclick={() => toggleDirectory(node.path)}
        class="w-full flex items-center gap-2 px-2 py-1 hover:bg-accent rounded-sm transition-colors"
        style="padding-left: {depth * 12 + 8}px"
      >
        {#if isExpanded}
          <ChevronDown class="h-4 w-4 flex-shrink-0" />
        {:else}
          <ChevronRight class="h-4 w-4 flex-shrink-0" />
        {/if}
        <Folder class="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span class="text-sm">{node.name}</span>
      </button>
      {#if isExpanded && node.children}
        {#each node.children as child (child.path)}
          {@render FileTreeNode({ node: child, depth: depth + 1, isExpanded: expandedDirs.has(child.path), isSelected: selectedFile?.path === child.path, selectFile, toggleDirectory })}
        {/each}
      {/if}
    </div>
  {:else}
    <button
      onclick={() => selectFile(node)}
      class="w-full flex items-center gap-2 px-2 py-1 hover:bg-accent rounded-sm transition-colors {isSelected ? 'bg-accent' : ''}"
      style="padding-left: {depth * 12 + 32}px"
    >
      <File class="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span class="text-sm flex-1 text-left">{node.name}</span>
      {#if node.additions || node.deletions}
        <div class="flex items-center gap-1 text-xs">
          {#if node.additions}
            <span class="text-green-600">+{node.additions}</span>
          {/if}
          {#if node.deletions}
            <span class="text-red-600">-{node.deletions}</span>
          {/if}
        </div>
      {/if}
    </button>
  {/if}
{/snippet}
