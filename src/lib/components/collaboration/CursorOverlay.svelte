<script lang="ts">
  import { onMount } from 'svelte';

  interface CursorPosition {
    x: number;
    y: number;
    user: {
      id: string;
      name: string;
      color?: string;
    };
  }

  interface Props {
    cursors: CursorPosition[];
    container?: HTMLElement;
    offsetTop?: number;
    offsetLeft?: number;
  }

  let { cursors = [], container, offsetTop = 0, offsetLeft = 0 }: Props = $props();

  // Default colors if not provided
  const colors = [
    '#EF4444', // red
    '#F59E0B', // amber
    '#10B981', // emerald
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
  ];

  function getUserColor(userId: string, userColor?: string) {
    if (userColor) return userColor;
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
</script>

<div class="pointer-events-none absolute inset-0 overflow-hidden z-50">
  {#each cursors as cursor (cursor.user.id)}
    <div
      class="absolute transition-all duration-100 ease-linear flex flex-col items-start gap-1"
      style="left: {cursor.x}px; top: {cursor.y}px;"
    >
      <!-- Cursor Arrow -->
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style="color: {getUserColor(cursor.user.id, cursor.user.color)}; transform: rotate(-15deg);"
      >
        <path
          d="M3 1L14.5 12.5L9.5 13.5L8.5 15.5L3 1Z"
          fill="currentColor"
          stroke="white"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </svg>

      <!-- Name Tag -->
      <div
        class="px-2 py-0.5 rounded-full text-[10px] font-medium text-white shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
        style="background-color: {getUserColor(cursor.user.id, cursor.user.color)};"
      >
        {cursor.user.name}
      </div>
    </div>
  {/each}
</div>

<style>
    /* Ensure the cursor layer doesn't block interaction */
    div {
        pointer-events: none;
    }
</style>
