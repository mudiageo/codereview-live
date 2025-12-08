<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from '$lib/components/ui/dialog';
  import { Badge } from '$lib/components/ui/badge';
  import Check from '@lucide/svelte/icons/check';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Zap from '@lucide/svelte/icons/zap';
  
  interface Props {
    open?: boolean;
    feature: string;
    requiredPlan: 'pro' | 'team';
    onClose?: () => void;
    onUpgrade?: () => void;
  }
  
  let { open = $bindable(false), feature, requiredPlan, onClose, onUpgrade }: Props = $props();
  
  const plans = {
    pro: {
      name: 'Pro',
      price: 20,
      icon: Zap,
      features: [
        'Unlimited cloud sync',
        '50GB storage',
        '1,000 AI credits/month',
        'Advanced AI features',
        'Priority support'
      ]
    },
    team: {
      name: 'Team',
      price: 50,
      icon: Sparkles,
      features: [
        'Everything in Pro',
        '200GB storage',
        '5,000 AI credits/month',
        'Up to 10 team members',
        'SSO & Admin controls',
        'Analytics dashboard'
      ]
    }
  };
  
  const plan = $derived(plans[requiredPlan]);
</script>

<Dialog bind:open>
  <DialogContent class="sm:max-w-md">
    <DialogHeader>
      <div class="flex items-center justify-center mb-4">
        <div class="rounded-full bg-primary/10 p-3">
          <plan.icon class="h-8 w-8 text-primary" />
        </div>
      </div>
      <DialogTitle class="text-center">Upgrade to {plan.name}</DialogTitle>
      <DialogDescription class="text-center">
        {feature} requires the {plan.name} plan
      </DialogDescription>
    </DialogHeader>
    
    <div class="space-y-4 py-4">
      <div class="text-center">
        <span class="text-4xl font-bold">${plan.price}</span>
        <span class="text-muted-foreground">/month</span>
      </div>
      
      <ul class="space-y-2">
        {#each plan.features as feature}
          <li class="flex items-center gap-2 text-sm">
            <Check class="h-4 w-4 text-primary flex-shrink-0" />
            <span>{feature}</span>
          </li>
        {/each}
      </ul>
    </div>
    
    <DialogFooter class="sm:justify-center">
      <Button variant="outline" onclick={onClose}>Maybe Later</Button>
      <Button onclick={onUpgrade}>Upgrade Now</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>