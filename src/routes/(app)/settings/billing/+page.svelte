<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Progress } from '$lib/components/ui/progress';
  import Check from '@lucide/svelte/icons/check';
  import CreditCard from '@lucide/svelte/icons/credit-card';
  import Download from '@lucide/svelte/icons/download';
  
  const currentPlan = {
    name: 'Free',
    price: 0,
    period: 'month'
  };
  
  const usage = {
    cloudReviews: { used: 4, limit: 10 },
    storage: { used: 234, limit: 1024 }, // MB
    aiCredits: { used: 153, limit: 1000 }
  };
  
  const plans = [
    {
      name: 'Free',
      price: 0,
      features: [
        'Unlimited local reviews',
        '10 cloud syncs/month',
        '1GB storage',
        '50 AI credits',
        'Individual use'
      ]
    },
    {
      name: 'Pro',
      price: 20,
      popular: true,
      features: [
        'Unlimited local reviews',
        'Unlimited cloud sync',
        '50GB storage',
        '1,000 AI credits',
        'Priority support',
        'Advanced AI features'
      ]
    },
    {
      name: 'Team',
      price: 50,
      features: [
        'Everything in Pro',
        '200GB storage',
        '5,000 AI credits',
        'Up to 10 team members',
        'SSO & Admin controls',
        'Analytics dashboard'
      ]
    }
  ];
  
  const invoices = [
    { id: '1', date: 'Dec 1, 2024', amount: '$20.00', status: 'paid' },
    { id: '2', date: 'Nov 1, 2024', amount: '$20.00', status: 'paid' },
  ];
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
          <p class="text-2xl font-bold">{currentPlan.name} Plan</p>
          <p class="text-sm text-muted-foreground">
            ${currentPlan.price}/{currentPlan.period}
          </p>
        </div>
        <Button>Upgrade to Pro</Button>
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
          <span>{usage.cloudReviews.used} / {usage.cloudReviews.limit}</span>
        </div>
        <Progress value={(usage.cloudReviews.used / usage.cloudReviews.limit) * 100} />
      </div>
      
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span>Storage</span>
          <span>{usage.storage.used} MB / {usage.storage.limit} MB</span>
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
      {#each plans as plan}
        <Card class={plan.popular ? 'border-primary' : ''}>
          {#if plan.popular}
            <div class="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium text-center">
              Most Popular
            </div>
          {/if}
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <div class="mt-4">
              <span class="text-4xl font-bold">${plan.price}</span>
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
            <Button class="w-full" variant={plan.name === currentPlan.name ? 'secondary' : 'default'}>
              {plan.name === currentPlan.name ? 'Current Plan' : `Upgrade to ${plan.name}`}
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
            <p class="font-medium">Visa ending in 4242</p>
            <p class="text-sm text-muted-foreground">Expires 12/2025</p>
          </div>
        </div>
        <Button variant="outline">Update</Button>
      </div>
    </CardContent>
  </Card>

  <!-- Billing History -->
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
              <Button variant="ghost" size="icon">
                <Download class="h-4 w-4" />
              </Button>
            </div>
          </div>
        {/each}
      </div>
    </CardContent>
  </Card>
</div>