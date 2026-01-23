<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Check from '@lucide/svelte/icons/check';
    import X from '@lucide/svelte/icons/x';
    import { plans } from '$lib/config/plans';
</script>

<div class="pt-24 pb-20">
    <div class="container mx-auto px-4">
        <div class="text-center max-w-3xl mx-auto mb-16">
            <h1 class="text-4xl md:text-6xl font-bold tracking-tight mb-6">Simple pricing for <span class="text-primary">every</span> team</h1>
            <p class="text-xl text-muted-foreground">
                Start for free, upgrade when you need to. No hidden fees.
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <!-- Free Tier -->
            <div class="rounded-3xl border bg-card p-8 flex flex-col hover:border-primary/50 transition-colors">
                <div class="mb-8">
                    <h3 class="text-xl font-bold mb-2">Starter</h3>
                    <p class="text-muted-foreground text-sm">Perfect for hobbyists and open source.</p>
                </div>
                <div class="mb-8">
                    <div class="flex items-baseline gap-1">
                        <span class="text-4xl font-bold">${plans.free.price.stripe}</span>
                        {#if plans.free.price.paystack > 0}
                            <span class="text-xl text-muted-foreground">/ ₦{plans.free.price.paystack.toLocaleString()}</span>
                        {/if}
                    </div>
                    <span class="text-muted-foreground">/month</span>
                </div>
                <Button variant="outline" class="w-full mb-8" href="/register">Get Started</Button>
                <div class="space-y-4 flex-1">
                    {#each plans.free.features as feature}
                        <div class="flex items-center gap-3 text-sm">
                            <Check class="h-4 w-4 text-green-500" /> <span>{feature}</span>
                        </div>
                    {/each}
                     <div class="flex items-center gap-3 text-sm text-muted-foreground">
                        <X class="h-4 w-4" /> <span>Team Management</span>
                    </div>
                </div>
            </div>

            <!-- Pro Tier -->
            <div class="rounded-3xl border-2 border-primary bg-card p-8 flex flex-col relative shadow-2xl">
                <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                </div>
                <div class="mb-8">
                    <h3 class="text-xl font-bold mb-2">{plans.pro.name}</h3>
                    <p class="text-muted-foreground text-sm">For professional developers.</p>
                </div>
                <div class="mb-8">
                    <div class="flex items-baseline gap-1">
                        <span class="text-4xl font-bold">${plans.pro.price.stripe}</span>
                        <span class="text-xl text-muted-foreground">/ ₦{plans.pro.price.paystack.toLocaleString()}</span>
                    </div>
                    <span class="text-muted-foreground">/month</span>
                </div>
                <Button class="w-full mb-8" href="/register?plan=pro">Start Free Trial</Button>
                <div class="space-y-4 flex-1">
                    {#each plans.pro.features as feature}
                        <div class="flex items-center gap-3 text-sm">
                            <Check class="h-4 w-4 text-green-500" /> <span>{feature}</span>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Team Tier -->
            <div class="rounded-3xl border bg-card p-8 flex flex-col hover:border-primary/50 transition-colors">
                <div class="mb-8">
                    <h3 class="text-xl font-bold mb-2">{plans.team.name}</h3>
                    <p class="text-muted-foreground text-sm">For organizations and agencies.</p>
                </div>
                <div class="mb-8">
                    <div class="flex items-baseline gap-1">
                        <span class="text-4xl font-bold">${plans.team.price.stripe}</span>
                        <span class="text-xl text-muted-foreground">/ ₦{plans.team.price.paystack.toLocaleString()}</span>
                    </div>
                    <span class="text-muted-foreground">/seat/mo</span>
                </div>
                <Button variant="outline" class="w-full mb-8" href="/contact">Contact Sales</Button>
                <div class="space-y-4 flex-1">
                    {#each plans.team.features as feature}
                         <div class="flex items-center gap-3 text-sm">
                            <Check class="h-4 w-4 text-green-500" /> <span>{feature}</span>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="mt-20 text-center max-w-2xl mx-auto">
            <h3 class="text-2xl font-bold mb-4">FAQ</h3>
            <div class="space-y-6 text-left">
                <div>
                    <h4 class="font-semibold mb-2">Can I switch plans later?</h4>
                    <p class="text-muted-foreground text-sm">Yes, you can upgrade or downgrade at any time. Prorated charges will apply.</p>
                </div>
                <div>
                    <h4 class="font-semibold mb-2">Is there a free trial for Pro?</h4>
                    <p class="text-muted-foreground text-sm">Yes, we offer a 14-day free trial for the Pro plan. No credit card required.</p>
                </div>
                 <div>
                    <h4 class="font-semibold mb-2">What happens to my videos if I cancel?</h4>
                    <p class="text-muted-foreground text-sm">We keep your data for 30 days after cancellation, allowing you to export or reactivate.</p>
                </div>
            </div>
        </div>
    </div>
</div>
