<script lang="ts">
  import { Card } from '$lib/components/ui/card';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';

  interface TeamMember {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  }

  interface Props {
    members: TeamMember[];
    searchQuery: string;
    onSelect: (member: TeamMember) => void;
    position: { top: number; left: number };
  }

  let { members, searchQuery, onSelect, position }: Props = $props();

  const filteredMembers = $derived(
    members.filter(m =>
      m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
  );

  let selectedIndex = $state(0);

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredMembers.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      if (filteredMembers[selectedIndex]) {
        onSelect(filteredMembers[selectedIndex]);
      }
    }
  }

  $effect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

{#if filteredMembers.length > 0}
  <Card
    class="absolute z-50 w-64 p-2"
    style="top: {position.top}px; left: {position.left}px;"
  >
    {#each filteredMembers as member, i}
      <button
        class="w-full flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors"
        class:bg-accent={i === selectedIndex}
        onclick={() => onSelect(member)}
        type="button"
      >
        <Avatar class="h-6 w-6">
          <AvatarImage src={member.avatar} alt={member.displayName} />
          <AvatarFallback>{member.displayName[0]}</AvatarFallback>
        </Avatar>
        <div class="flex flex-col items-start">
          <span class="text-sm font-medium">{member.displayName}</span>
          <span class="text-xs text-muted-foreground">@{member.username}</span>
        </div>
      </button>
    {/each}
  </Card>
{/if}
