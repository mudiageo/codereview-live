<script lang="ts">
  import { notificationsStore } from '#lib/stores/notifications.svelte.js';
  import { Button } from '#lib/components/ui/button/index.js';
  import { Badge } from '#lib/components/ui/badge/index.js';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
  } from '#lib/components/ui/dropdown-menu/index.js';
  import { ScrollArea } from '#lib/components/ui/scroll-area/index.js';
  import Bell from '@lucide/svelte/icons/bell';
  import Check from '@lucide/svelte/icons/check';
  import Trash from '@lucide/svelte/icons/trash';
  import { goto } from '$app/navigation';

  $effect(() => {
    notificationsStore.load();
  });

  const unreadCount = $derived(notificationsStore.unreadCount);
  const notifications = $derived(notificationsStore.all.slice(0, 5)); // Show recent 5

  function handleNotificationClick(notification: any) {
    if (!notification.read) {
      notificationsStore.markAsRead(notification.id);
    }
    if (notification.link) {
      goto(notification.link);
    }
  }

  function markAllRead() {
    notificationsStore.markAllAsRead();
  }
</script>

<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child(props)}
      <Button {...props} variant="ghost" size="icon" class="relative">
        <Bell class="h-5 w-5" />
        {#if unreadCount > 0}
          <span class="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-background"></span>
        {/if}
      </Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" class="w-80">
    <div class="flex items-center justify-between px-4 py-2">
      <h4 class="text-sm font-semibold">Notifications</h4>
      {#if unreadCount > 0}
        <Button variant="ghost" size="sm" class="h-auto p-0 text-xs text-muted-foreground hover:text-primary" onclick={markAllRead}>
          Mark all read
        </Button>
      {/if}
    </div>
    <DropdownMenuSeparator />
    {#if notifications.length === 0}
      <div class="p-8 text-center text-sm text-muted-foreground">
        No notifications
      </div>
    {:else}
      <div class="max-h-[300px] overflow-y-auto">
        {#each notifications as notification}
          <DropdownMenuItem
            class={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
            onclick={() => handleNotificationClick(notification)}
          >
            <div class="flex w-full items-start justify-between gap-2">
              <span class="font-medium text-sm leading-none">{notification.title}</span>
              {#if !notification.read}
                <span class="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1"></span>
              {/if}
            </div>
            <p class="text-xs text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
            <span class="text-[10px] text-muted-foreground mt-1">
              {new Date(notification.createdAt).toLocaleDateString()}
            </span>
          </DropdownMenuItem>
        {/each}
      </div>
    {/if}
    <DropdownMenuSeparator />
    <DropdownMenuItem class="justify-center text-center cursor-pointer" onclick={() => goto('/notifications')}>
      View all notifications
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
