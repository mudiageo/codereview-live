<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from '$lib/components/ui/command';
  import FileVideo from '@lucide/svelte/icons/file-video';
  import Folder from '@lucide/svelte/icons/folder';
  import Users from '@lucide/svelte/icons/users';
  import Settings from '@lucide/svelte/icons/settings';
  
  interface Props {
    open?: boolean;
  }
  
  let { open = $bindable(false) }: Props = $props();
  
  const recentSearches = [
    { type: 'review', title: 'JWT Authentication', href: '/reviews/1' },
    { type: 'project', title: 'My Awesome App', href: '/projects/1' },
  ];
  
  const quickActions = [
    { icon: FileVideo, label: 'New Review', href: '/reviews/new' },
    { icon: Folder, label: 'New Project', href: '/projects/new' },
    { icon: Users, label: 'Invite Team', href: '/team' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];
  
  function handleSelect(href: string) {
    open = false;
    goto(href);
  }
  
  $effect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        open = !open;
      }
    };
    
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  });
</script>

<CommandDialog bind:open>
  <CommandInput placeholder="Search reviews, projects, people..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    
    <CommandGroup heading="Quick Actions">
      {#each quickActions as action}
        <CommandItem onSelect={() => handleSelect(action.href)}>
          <svelte:component this={action.icon} class="mr-2 h-4 w-4" />
          <span>{action.label}</span>
        </CommandItem>
      {/each}
    </CommandGroup>
    
    {#if recentSearches.length > 0}
      <CommandGroup heading="Recent">
        {#each recentSearches as search}
          <CommandItem onSelect={() => handleSelect(search.href)}>
            {#if search.type === 'review'}
              <FileVideo class="mr-2 h-4 w-4" />
            {:else}
              <Folder class="mr-2 h-4 w-4" />
            {/if}
            <span>{search.title}</span>
          </CommandItem>
        {/each}
      </CommandGroup>
    {/if}
  </CommandList>
</CommandDialog>
