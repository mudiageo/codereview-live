<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import Lock from '@lucide/svelte/icons/lock';
  import { auth } from '$lib/stores/auth.svelte';
  
  interface Props {
    children: import('svelte').Snippet;
    requireAuth?: boolean;
    requirePlan?: 'free' | 'pro' | 'team';
    fallback?: import('svelte').Snippet;
  }
  
  let { children, requireAuth = true, requirePlan, fallback }: Props = $props();
  
  const user = $derived(auth.currentUser);
  const isAuthenticated = $derived(!!user);
  const hasRequiredPlan = $derived.by(() => {
    if (!requirePlan || !user) return true;
    
    const planHierarchy = { free: 0, pro: 1, team: 2 };
    const userPlanLevel = planHierarchy[user.plan as keyof typeof planHierarchy] || 0;
    const requiredPlanLevel = planHierarchy[requirePlan];
    
    return userPlanLevel >= requiredPlanLevel;
  });
  
  onMount(() => {
    if (requireAuth && !isAuthenticated) {
      //goto(`/login?redirect=${page.url.pathname}`);
    }
  });
  
  const canAccess = $derived(
    (!requireAuth || isAuthenticated) && (!requirePlan || hasRequiredPlan)
  );
</script>

{#if canAccess}
  {@render children()}
{:else if fallback}
  {@render fallback()}
{:else if requireAuth && !isAuthenticated}
  <div class="flex items-center justify-center min-h-[60vh]">
    <Card.Root class="max-w-md">
      <Card.Header class="text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
          <Lock class="h-6 w-6 text-primary" />
        </div>
        <Card.Title>Authentication Required</Card.Title>
        <Card.Description>Please sign in to access this page</Card.Description>
      </Card.Header>
      <Card.Content class="space-y-2">
        <Button href="/login?redirect={page.url.pathname}" class="w-full">
          Sign In
        </Button>
        <Button href="/signup" variant="outline" class="w-full">
          Create Account
        </Button>
      </Card.Content>
    </Card.Root>
  </div>
{:else if requirePlan && !hasRequiredPlan}
  <div class="flex items-center justify-center min-h-[60vh]">
    <Card.Root class="max-w-md">
      <Card.Header class="text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
          <Lock class="h-6 w-6 text-primary" />
        </div>
        <Card.Title>Upgrade Required</Card.Title>
        <Card.Description>
          This feature requires the {requirePlan.charAt(0).toUpperCase() + requirePlan.slice(1)} plan
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <Button href="/settings/billing" class="w-full">
          Upgrade Now
        </Button>
      </Card.Content>
    </Card.Root>
  </div>
{/if}