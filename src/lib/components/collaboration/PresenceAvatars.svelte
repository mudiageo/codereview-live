<script lang="ts">
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

  interface UserPresence {
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
    status?: 'online' | 'idle' | 'away' | 'offline';
    lastSeen?: number;
    custom?: any;
  }

  interface Props {
    users: UserPresence[];
    max?: number;
  }

  let { users = [], max = 4 }: Props = $props();

  const visibleUsers = $derived(users.slice(0, max));
  const remainingCount = $derived(Math.max(0, users.length - max));

  function getInitials(name: string) {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  }
</script>

<div class="flex items-center -space-x-2 overflow-hidden">
  {#each visibleUsers as presence (presence.user.id)}
    <Tooltip>
      <TooltipTrigger>
        <Avatar class="border-2 border-background w-8 h-8 transition-transform hover:z-10 hover:scale-110">
          <AvatarImage src={presence.user.avatar} alt={presence.user.name} />
          <AvatarFallback class="text-xs bg-muted text-muted-foreground">
            {getInitials(presence.user.name)}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>
        <p>{presence.user.name}</p>
        <p class="text-xs text-muted-foreground capitalize">{presence.status || 'Online'}</p>
      </TooltipContent>
    </Tooltip>
  {/each}

  {#if remainingCount > 0}
    <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground z-0">
      +{remainingCount}
    </div>
  {/if}
</div>
