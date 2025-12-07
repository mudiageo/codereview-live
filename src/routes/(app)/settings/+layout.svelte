<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';
  import User from '@lucide/svelte/icons/user';
  import Palette from '@lucide/svelte/icons/palette';
  import Video from '@lucide/svelte/icons/video';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import CreditCard from '@lucide/svelte/icons/credit-card';
  import Users from '@lucide/svelte/icons/users';
  import Bell from '@lucide/svelte/icons/bell';
  import Shield from '@lucide/svelte/icons/shield';
  
  let { children } = $props();
  
  const navigation = [
    { name: 'Profile', href: '/settings', icon: User },
    { name: 'Appearance', href: '/settings/appearance', icon: Palette },
    { name: 'Video', href: '/settings/video', icon: Video },
    { name: 'AI Features', href: '/settings/ai', icon: Sparkles },
    { name: 'Notifications', href: '/settings/notifications', icon: Bell },
    { name: 'Billing', href: '/settings/billing', icon: CreditCard },
    { name: 'Team', href: '/settings/team', icon: Users },
    { name: 'Security', href: '/settings/security', icon: Shield },
  ];
  
  function isActive(href: string) {
    if (href === '/settings') {
      return page.url.pathname === '/settings';
    }
    return page.url.pathname.startsWith(href);
  }
</script>

<!-- Desktop Layout -->
<div class="hidden lg:flex h-[calc(100vh-8rem)] gap-6">
  <!-- Sidebar -->
  <aside class="w-64 flex-shrink-0">
    <nav class="space-y-1">
      {#each navigation as item}
        <a
          href={item.href}
          class={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(item.href)
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <item.icon class="h-5 w-5" />
          {item.name}
        </a>
      {/each}
    </nav>
  </aside>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto">
    {@render children()}
  </div>
</div>

<!-- Mobile Layout -->
<div class="lg:hidden space-y-4">
  <!-- Mobile Nav -->
  <div class="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4">
    {#each navigation as item}
      <a
        href={item.href}
        class={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
          isActive(item.href)
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <item.icon class="h-4 w-4" />
        {item.name}
      </a>
    {/each}
  </div>

  <!-- Content -->
  <div>
    {@render children()}
  </div>
</div>