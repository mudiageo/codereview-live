<script lang="ts">
  import { notificationsStore } from '$lib/stores/notifications.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
  import Bell from '@lucide/svelte/icons/bell';
  import Check from '@lucide/svelte/icons/check';
  import Trash from '@lucide/svelte/icons/trash';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';

  $effect(() => {
    notificationsStore.load();
  });

  const allNotifications = $derived(notificationsStore.all);
  const unreadNotifications = $derived(notificationsStore.unread);
  const readNotifications = $derived(notificationsStore.data.filter(n => n.read));

  function handleClick(notification: any) {
    if (!notification.read) {
      notificationsStore.markAsRead(notification.id);
    }
    if (notification.link) {
      goto(notification.link);
    }
  }

  async function markAllRead() {
    try {
      await notificationsStore.markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error('Failed to update notifications');
    }
  }

  async function deleteNotification(e: Event, id: string) {
    e.stopPropagation();
    try {
      await notificationsStore.delete(id);
      toast.success('Notification removed');
    } catch (e) {
      toast.error('Failed to remove notification');
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Notifications</h1>
      <p class="text-muted-foreground">Manage your updates and alerts</p>
    </div>
    <div class="flex gap-2">
      {#if unreadNotifications.length > 0}
        <Button variant="outline" class="gap-2" onclick={markAllRead}>
          <Check class="h-4 w-4" />
          Mark all read
        </Button>
      {/if}
    </div>
  </div>

  <Tabs value="all" class="space-y-4">
    <TabsList>
      <TabsTrigger value="all">All</TabsTrigger>
      <TabsTrigger value="unread">Unread ({unreadNotifications.length})</TabsTrigger>
      <TabsTrigger value="archived">Archived</TabsTrigger>
    </TabsList>

    <TabsContent value="all" class="space-y-4">
      {#if allNotifications.length === 0}
        <div class="text-center py-12 text-muted-foreground">
          <Bell class="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>You're all caught up!</p>
        </div>
      {:else}
        {#each allNotifications as notification}
          <Card
            class={`transition-all hover:bg-accent/50 cursor-pointer ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}
            onclick={() => handleClick(notification)}
          >
            <CardContent class="flex items-start justify-between p-4">
              <div class="flex gap-4">
                <div class={`mt-1 h-2 w-2 rounded-full ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                <div>
                  <h4 class="font-medium text-sm">{notification.title}</h4>
                  <p class="text-sm text-muted-foreground">{notification.message}</p>
                  <p class="text-xs text-muted-foreground mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onclick={(e) => deleteNotification(e, notification.id)}
              >
                <Trash class="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </CardContent>
          </Card>
        {/each}
      {/if}
    </TabsContent>

    <TabsContent value="unread" class="space-y-4">
       {#if unreadNotifications.length === 0}
        <div class="text-center py-12 text-muted-foreground">
          <p>No unread notifications.</p>
        </div>
      {:else}
        {#each unreadNotifications as notification}
          <Card
            class="transition-all hover:bg-accent/50 cursor-pointer border-l-4 border-l-blue-500"
            onclick={() => handleClick(notification)}
          >
            <CardContent class="flex items-start justify-between p-4">
              <div class="flex gap-4">
                <div class="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
                <div>
                  <h4 class="font-medium text-sm">{notification.title}</h4>
                  <p class="text-sm text-muted-foreground">{notification.message}</p>
                  <p class="text-xs text-muted-foreground mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onclick={(e) => deleteNotification(e, notification.id)}
              >
                <Trash class="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </CardContent>
          </Card>
        {/each}
      {/if}
    </TabsContent>

    <TabsContent value="archived" class="space-y-4">
      <div class="text-center py-12 text-muted-foreground">
        <p>Archived notifications are not yet implemented separately (using delete for now).</p>
      </div>
    </TabsContent>
  </Tabs>
</div>
