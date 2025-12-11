<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu';
  import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import Grid3x3 from '@lucide/svelte/icons/grid-3x3';
  import List from '@lucide/svelte/icons/list';
  import MoreVertical from '@lucide/svelte/icons/more-vertical';
  import Folder from '@lucide/svelte/icons/folder';
  import FileVideo from '@lucide/svelte/icons/file-video';
  import Users from '@lucide/svelte/icons/users';
  import Clock from '@lucide/svelte/icons/clock';
  import { projectsStore } from '$lib/stores/index.svelte';
  import { SearchEngine } from '$lib/utils/search';
  
  let view = $state<'grid' | 'list'>('grid');
  let searchQuery = $state('');
  let loading = $state(false);
  
  const projects = $state(projectsStore.data)
  
  const filteredProjects = $derived(
    searchQuery 
      ? SearchEngine.searchProjects(projects, searchQuery)
      : projects
  );
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Projects</h1>
      <p class="text-muted-foreground">Organize your code reviews by project</p>
    </div>
    <Button href="/projects/new" class="gap-2">
      <Plus class="h-4 w-4" />
      New Project
    </Button>
  </div>

  <!-- Toolbar -->
  <div class="flex items-center gap-4">
    <div class="relative flex-1 max-w-md">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search projects..."
        class="pl-9"
        bind:value={searchQuery}
      />
    </div>
    
    <Tabs bind:value={view}>
      <TabsList>
        <TabsTrigger value="grid" class="gap-2">
          <Grid3x3 class="h-4 w-4" />
          Grid
        </TabsTrigger>
        <TabsTrigger value="list" class="gap-2">
          <List class="h-4 w-4" />
          List
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </div>

  <!-- Projects Grid/List -->
  {#if loading}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each Array(6) as _}
        <Card>
          <CardHeader>
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton class="h-4 w-full mb-2" />
            <Skeleton class="h-4 w-2/3" />
          </CardContent>
        </Card>
      {/each}
    </div>
  {:else if filteredProjects.length === 0}
    <Card>
      <CardContent class="flex flex-col items-center justify-center p-12 text-center">
        <div class="rounded-full bg-muted p-4 mb-4">
          <Folder class="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 class="text-lg font-semibold mb-2">No projects found</h3>
        <p class="text-sm text-muted-foreground mb-4 max-w-sm">
          {searchQuery ? 'Try a different search term' : 'Create your first project to organize your reviews'}
        </p>
        {#if !searchQuery}
          <Button href="/projects/new" class="gap-2">
            <Plus class="h-4 w-4" />
            Create Project
          </Button>
        {/if}
      </CardContent>
    </Card>
  {:else if view === 'grid'}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each filteredProjects as project}
        <a href="/projects/{project.id}" class="group">
          <Card class="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    class="h-12 w-12 rounded-lg flex items-center justify-center text-white"
                    style="background-color: {project.color}"
                  >
                    <Folder class="h-6 w-6" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <CardTitle class="truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </CardTitle>
                    <CardDescription class="truncate">{project.description}</CardDescription>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    {#snippet child(props)}
                    <Button {...props} variant="ghost" size="icon" class="h-8 w-8">
                      <MoreVertical class="h-4 w-4" />
                    </Button>
                    {/snippet}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Archive</DropdownMenuItem>
                    <DropdownMenuItem class="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-4 text-muted-foreground">
                  <div class="flex items-center gap-1">
                    <FileVideo class="h-4 w-4" />
                    <span>{project.reviewCount}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Users class="h-4 w-4" />
                    <span>{project.memberCount}</span>
                  </div>
                </div>
                {#if project.isTeam}
                  <Badge variant="secondary">Team</Badge>
                {/if}
              </div>
              
              <div class="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock class="h-3 w-3" />
                <span>Updated {project.lastActivity}</span>
              </div>
            </CardContent>
          </Card>
        </a>
      {/each}
    </div>
  {:else}
    <div class="space-y-2">
      {#each filteredProjects as project}
        <a href="/projects/{project.id}">
          <Card class="transition-all hover:shadow-md">
            <CardContent class="flex items-center gap-4 p-4">
              <div 
                class="h-10 w-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                style="background-color: {project.color}"
              >
                <Folder class="h-5 w-5" />
              </div>
              
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold truncate">{project.name}</h3>
                <p class="text-sm text-muted-foreground truncate">{project.description}</p>
              </div>
              
              <div class="flex items-center gap-6 text-sm text-muted-foreground">
                <div class="flex items-center gap-1">
                  <FileVideo class="h-4 w-4" />
                  <span>{project.reviewCount}</span>
                </div>
                <div class="flex items-center gap-1">
                  <Users class="h-4 w-4" />
                  <span>{project.memberCount}</span>
                </div>
                <span class="text-xs">{project.lastActivity}</span>
              </div>
              
              {#if project.isTeam}
                <Badge variant="secondary">Team</Badge>
              {/if}
            </CardContent>
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>