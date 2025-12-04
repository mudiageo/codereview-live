<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';
  import AlertCircle from '@lucide/svelte/icons/alert-circle';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  
  interface Props {
    type: 'cloud-reviews' | 'storage' | 'ai-credits' | 'team-members';
    current: number;
    limit: number;
    onUpgrade?: () => void;
  }
  
  let { type, current, limit, onUpgrade }: Props = $props();
  
  const messages = {
    'cloud-reviews': {
      title: 'Cloud Review Limit Reached',
      description: 'You\'ve used all your cloud syncs for this month',
      action: 'Upgrade to Pro for unlimited cloud syncs'
    },
    'storage': {
      title: 'Storage Limit Reached',
      description: 'Your video storage is full',
      action: 'Upgrade for more storage space'
    },
    'ai-credits': {
      title: 'AI Credits Exhausted',
      description: 'You\'ve used all your AI credits for this month',
      action: 'Upgrade for more AI credits'
    },
    'team-members': {
      title: 'Team Member Limit Reached',
      description: 'You\'ve reached the maximum team size for your plan',
      action: 'Upgrade to add more team members'
    }
  };
  
  const message = $derived(messages[type]);
  const percentage = $derived((current / limit) * 100);
</script>

<Card class="border-destructive/50 bg-destructive/5">
  <CardHeader>
    <div class="flex items-start gap-3">
      <div class="rounded-full bg-destructive/10 p-2">
        <AlertCircle class="h-5 w-5 text-destructive" />
      </div>
      <div class="flex-1">
        <CardTitle>{message.title}</CardTitle>
        <CardDescription class="mt-1">{message.description}</CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent class="space-y-4">
    <div class="space-y-2">
      <div class="flex justify-between text-sm">
        <span>Usage</span>
        <span class="font-medium">{current} / {limit}</span>
      </div>
      <Progress value={percentage} class="h-2" />
    </div>
    
    <Button onclick={onUpgrade} class="w-full gap-2">
      <Sparkles class="h-4 w-4" />
      {message.action}
    </Button>
  </CardContent>
</Card>