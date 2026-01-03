<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Progress } from '$lib/components/ui/progress';
  import Check from '@lucide/svelte/icons/check';
  import CreditCard from '@lucide/svelte/icons/credit-card';
  import Download from '@lucide/svelte/icons/download';
  import UpgradeDialog from '$lib/components/upgrade-dialog.svelte';
  import { subscriptionsStore, aiUsageStore } from '$lib/stores/index.svelte';
  import { auth } from '$lib/stores/auth.svelte';
  import { plans } from '$lib/config';
  import { onMount } from 'svelte';
  
  let showUpgradeDialog = $state(false);
  
  onMount(async () => {
    await subscriptionsStore.load();
    await aiUsageStore.load();
  });
  
  const currentPlan = $derived(auth.currentUser?.plan || 'free');
  const currentPlanDetails = $derived(plans[currentPlan as keyof typeof plans]);
  const subscription = $derived(subscriptionsStore.current);
  
  const usage = $derived({
    cloudReviews: { used: 4, limit: currentPlanDetails.limits.localReviews },
    storage: { used: 234, limit: parseInt(currentPlanDetails.limits.storage) || 1024 }, // MB
    aiCredits: { used: aiUsageStore.totalTokens, limit: currentPlanDetails.limits.aiCredits }
  });
  
  const availablePlans = [
    { ...plans.free, id: 'free' },
    { ...plans.pro, id: 'pro', popular: true },
    { ...plans.team, id: 'team' }
  ];
  
  const invoices = [
    { id: '1', date: 'Dec 1, 2024', amount: '$20.00', status: 'paid' },
    { id: '2', date: 'Nov 1, 2024', amount: '$20.00', status: 'paid' },
  ];
  
  const PAYMENT_PROVIDER_MESSAGE = 'Payment method setup will redirect to Stripe';
</script>

<div class="space-y-6">
  <!-- Current Plan -->
  <Card>
    <CardHeader>
      <CardTitle>Current Plan</CardTitle>
      <CardDescription>Your subscription details</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-2xl font-bold">{currentPlanDetails.name} Plan</p>
          <p class="text-sm text-muted-foreground">
            ${currentPlanDetails.price.stripe}/month
          </p>
          {#if subscription?.status}
            <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'} class="mt-2">
              {subscription.status}
            </Badge>
          {/if}
        </div>
        {#if currentPlan === 'free'}
          <Button onclick={() => showUpgradeDialog = true}>Upgrade to Pro</Button>
        {:else}
          <Button variant="outline" onclick={() => showUpgradeDialog = true}>Change Plan</Button>
        {/if}
      </div>
    </CardContent>
  </Card>

  <!-- Usage -->
  <Card>
    <CardHeader>
      <CardTitle>Usage This Month</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span>Cloud Reviews</span>
          <span>{usage.cloudReviews.used} / {usage.cloudReviews.limit === -1 ? 'Unlimited' : usage.cloudReviews.limit}</span>
        </div>
        {#if usage.cloudReviews.limit !== -1}
          <Progress value={(usage.cloudReviews.used / usage.cloudReviews.limit) * 100} />
        {/if}
      </div>
      
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span>Storage</span>
          <span>{usage.storage.used} MB / {currentPlanDetails.limits.storage}</span>
        </div>
        <Progress value={(usage.storage.used / usage.storage.limit) * 100} />
      </div>
      
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span>AI Credits</span>
          <span>{usage.aiCredits.used} / {usage.aiCredits.limit}</span>
        </div>
        <Progress value={(usage.aiCredits.used / usage.aiCredits.limit) * 100} />
      </div>
    </CardContent>
  </Card>

  <!-- Plans -->
  <div>
    <h2 class="text-2xl font-bold mb-4">Available Plans</h2>
    <div class="grid gap-4 md:grid-cols-3">
      {#each availablePlans as plan}
        <Card class={plan.popular ? 'border-primary' : ''}>
          {#if plan.popular}
            <div class="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium text-center">
              Most Popular
            </div>
          {/if}
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <div class="mt-4">
              <span class="text-4xl font-bold">${plan.price.stripe}</span>
              <span class="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <ul class="space-y-2">
              {#each plan.features as feature}
                <li class="flex items-center gap-2 text-sm">
                  <Check class="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              {/each}
            </ul>
            <Button 
              class="w-full" 
              variant={plan.id === currentPlan ? 'secondary' : 'default'}
              onclick={() => {
                if (plan.id !== currentPlan) {
                  showUpgradeDialog = true;
                }
              }}
            >
              {plan.id === currentPlan ? 'Current Plan' : `Upgrade to ${plan.name}`}
            </Button>
          </CardContent>
        </Card>
      {/each}
    </div>
  </div>

  <!-- Payment Method -->
  <Card>
    <CardHeader>
      <CardTitle>Payment Method</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex items-center justify-between p-4 border rounded-lg">
        <div class="flex items-center gap-3">
          <CreditCard class="h-5 w-5 text-muted-foreground" />
          <div>
            <p class="font-medium">No payment method on file</p>
            <p class="text-sm text-muted-foreground">Add a payment method to upgrade</p>
          </div>
        </div>
        <Button 
          variant="outline"
          onclick={() => toast.info(PAYMENT_PROVIDER_MESSAGE)}
        >
          Add Payment Method
        </Button>
      </div>
    </CardContent>
  </Card>

  <!-- Billing History -->
  {#if invoices.length > 0}
    <Card>
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          {#each invoices as invoice}
            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p class="font-medium">{invoice.date}</p>
                <Badge variant="outline" class="badge-published">Paid</Badge>
              </div>
              <div class="flex items-center gap-4">
                <span class="font-medium">{invoice.amount}</span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onclick={() => toast.info(`Downloading invoice for ${invoice.date}`)}
                >
                  <Download class="h-4 w-4" />
                </Button>
              </div>
            </div>
          {/each}
        </div>
      </CardContent>
    </Card>
  {/if}
</div>

<UpgradeDialog bind:open={showUpgradeDialog} currentPlan={currentPlan as any} />