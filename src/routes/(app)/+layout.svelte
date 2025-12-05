<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import { Badge } from '$lib/components/ui/badge';
  import Home from '@lucide/svelte/icons/home';
  import Folder from '@lucide/svelte/icons/folder';
  import Video from '@lucide/svelte/icons/video';
  import Users from '@lucide/svelte/icons/users';
  import Settings from '@lucide/svelte/icons/settings';
  import HelpCircle from '@lucide/svelte/icons/help-circle';
  import Search from '@lucide/svelte/icons/search';
  import Bell from '@lucide/svelte/icons/bell';
  import Plus from '@lucide/svelte/icons/plus';
  import LogOut from '@lucide/svelte/icons/log-out';
  import User from '@lucide/svelte/icons/user';
  import CreditCard from '@lucide/svelte/icons/credit-card';
  import Menu from '@lucide/svelte/icons/menu';
  import X from '@lucide/svelte/icons/x';
  import { cn } from '$lib/utils';
  
  let { children } = $props();
  
  // Mock user data - replace with actual auth store
  const user = $state({
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '',
    plan: 'pro'
  });
  
  let mobileMenuOpen = $state(false);
  let searchQuery = $state('');
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Projects', href: '/projects', icon: Folder },
    { name: 'Reviews', href: '/reviews', icon: Video },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Help', href: '/help', icon: HelpCircle },
  ];
  
  function isActive(href: string) {
    return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
  }
  
  function getInitials(name: string) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  
  function handleSearch(e: Event) {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  }
  
  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }
  
  import { onMount } from 'svelte';
  import { initDb, syncEngine } from '$lib/db';

  import { reviewsStore, projectsStore, commentsStore,} from '$lib/stores/index.svelte';

  import { Toaster } from '$lib/components/ui/sonner';
  import SearchCommand from '$lib/components/search-command.svelte';
  import { browser } from '$app/environment';

  let searchOpen = $state(false);
  
  onMount(async () => {
    if (!browser) return;
    
    try {
      // Initialize database
      await initDb();
      
      // Load initial data
      await Promise.all([
        reviewsStore.load(),
        projectsStore.load(),
        commentsStore.load(),
      ]);
      
      // Start sync
      
    } catch (err) {
      console.error('Failed to initialize app:', err);
    }
    
    return () => {
      // Cleanup on unmount
      syncEngine.destroy();
    };
  });
  
  const syncState = $derived(syncEngine.state);
</script>

<Toaster richColors position="top-right" />
<SearchCommand bind:open={searchOpen} />

<!-- Sync Status Indicator -->
{#if syncState.isSyncing}
  <div class="fixed top-4 right-4 z-50 animate-pulse">
    <div class="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg">
      <div class="h-2 w-2 bg-white rounded-full animate-ping"></div>
      <span class="text-sm">Syncing...</span>
    </div>
  </div>
{:else if !syncState.isOnline}
  <div class="fixed top-4 right-4 z-50">
    <div class="flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-2 rounded-lg shadow-lg">
      <div class="h-2 w-2 bg-white rounded-full"></div>
      <span class="text-sm">Offline</span>
    </div>
  </div>
{/if}

<!-- Desktop Layout -->
<div class="flex h-screen overflow-hidden bg-background">
  <!-- Sidebar (Desktop) -->
  <aside class="hidden lg:flex lg:w-64 lg:flex-col border-r bg-sidebar">
    <!-- Logo -->
    <div class="flex h-16 items-center gap-2 border-b px-6">
      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Video class="h-5 w-5" />
      </div>
      <span class="text-lg font-semibold">CodeReview.live</span>
    </div>
    
    <!-- Navigation -->
    <nav class="flex-1 space-y-1 p-4 overflow-y-auto">
      {#each navigation as item}
        <a
          href={item.href}
          class={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(item.href)
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}
        >
          <item.icon class="h-5 w-5" />
          {item.name}
        </a>
      {/each}
    </nav>
    
    <!-- User Profile -->
    <div class="border-t p-4">
      <DropdownMenu>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button {...props} variant="ghost" class="w-full justify-start gap-2 px-2">
            <Avatar class="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div class="flex flex-1 flex-col items-start text-sm">
              <span class="font-medium">{user.name}</span>
              <span class="text-xs text-muted-foreground">{user.plan} plan</span>
            </div>
          </Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem href="/settings">
            <User class="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem href="/settings/billing">
            <CreditCard class="mr-2 h-4 w-4" />
            Billing
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut class="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </aside>
  
  <!-- Main Content Area -->
  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- Header -->
    <header class="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <!-- Mobile Menu Button -->
      <Button
        variant="ghost"
        size="icon"
        class="lg:hidden"
        onclick={toggleMobileMenu}
      >
        {#if mobileMenuOpen}
          <X class="h-5 w-5" />
        {:else}
          <Menu class="h-5 w-5" />
        {/if}
        <span class="sr-only">Toggle menu</span>
      </Button>
      
      <!-- Search Bar -->
      <form onsubmit={handleSearch} class="hidden sm:flex flex-1 max-w-md">
        <div class="relative w-full">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search reviews, projects..."
            class="pl-9 w-full"
            bind:value={searchQuery}
          />
        </div>
      </form>
      
      <div class="flex items-center gap-2 ml-auto">
        <!-- Create Button -->
        <Button href="/reviews/new" class="gap-2">
          <Plus class="h-4 w-4" />
          <span class="hidden sm:inline">New Review</span>
        </Button>
        
        <!-- Notifications -->
        <Button variant="ghost" size="icon" class="relative">
          <Bell class="h-5 w-5" />
          <Badge class="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            3
          </Badge>
          <span class="sr-only">Notifications</span>
        </Button>
        
        <!-- User Menu (Mobile) -->
        <div class="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger>
              {#snippet child({ props })}
                <Button {...props} variant="ghost" size="icon">
                <Avatar class="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                </Button>
              {/snippet}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuLabel>
                <div class="flex flex-col space-y-1">
                  <p class="text-sm font-medium">{user.name}</p>
                  <p class="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem href="/settings">
                <User class="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem href="/settings/billing">
                <CreditCard class="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut class="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
    
    <!-- Page Content -->
    <main class="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
      {@render children()}
    </main>
  </div>
</div>

<!-- Mobile Navigation -->
{#if mobileMenuOpen}
  <div class="fixed inset-0 z-50 lg:hidden">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-background/80 backdrop-blur-sm"
      onclick={toggleMobileMenu}
    ></div>
    
    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 w-64 bg-sidebar border-r">
      <!-- Logo -->
      <div class="flex h-16 items-center gap-2 border-b px-6">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Video class="h-5 w-5" />
        </div>
        <span class="text-lg font-semibold">CodeReview.live</span>
      </div>
      
      <!-- Navigation -->
      <nav class="flex-1 space-y-1 p-4 overflow-y-auto">
        {#each navigation as item}
          <a
            href={item.href}
            class={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
            onclick={toggleMobileMenu}
          >
            <item.icon class="h-5 w-5" />
            {item.name}
          </a>
        {/each}
      </nav>
    </aside>
  </div>
{/if}

<!-- Mobile Bottom Navigation -->
<nav class="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden">
  <div class="flex items-center justify-around px-4 h-16">
    <a
      href="/dashboard"
      class={cn(
        "flex flex-col items-center justify-center gap-1 w-full h-full",
        isActive('/dashboard') ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Home class="h-5 w-5" />
      <span class="text-xs">Home</span>
    </a>
    
    <a
      href="/projects"
      class={cn(
        "flex flex-col items-center justify-center gap-1 w-full h-full",
        isActive('/projects') ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Folder class="h-5 w-5" />
      <span class="text-xs">Projects</span>
    </a>
    
    <a
      href="/reviews/new"
      class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground -mt-6 shadow-lg"
    >
      <Plus class="h-6 w-6" />
    </a>
    
    <button
      class={cn(
        "flex flex-col items-center justify-center gap-1 w-full h-full",
        "text-muted-foreground"
      )}
    >
      <Bell class="h-5 w-5" />
      <span class="text-xs">Alerts</span>
    </button>
    
    <a
      href="/settings"
      class={cn(
        "flex flex-col items-center justify-center gap-1 w-full h-full",
        isActive('/settings') ? "text-primary" : "text-muted-foreground"
      )}
    >
      <User class="h-5 w-5" />
      <span class="text-xs">Profile</span>
    </a>
  </div>
</nav>