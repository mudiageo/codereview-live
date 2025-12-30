<script lang="ts">
	import { plans, type PlanId } from '$lib/config/plans';
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import Check from '@lucide/svelte/icons/check';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		currentPlan = 'free' as PlanId
	}: {
		open?: boolean;
		currentPlan?: PlanId;
	} = $props();

	let selectedPlan = $state<PlanId>('pro');
	let paymentProvider = $state<'stripe' | 'paystack'>('paystack');
	let isLoading = $state(false);

	const availablePlans = ['pro', 'team'] as const;

	async function handleUpgrade() {
		if (selectedPlan === currentPlan) {
			toast.error('You are already on this plan');
			return;
		}

		isLoading = true;

		try {
			if (paymentProvider === 'stripe') {
				const priceId =
					selectedPlan === 'pro'
						? import.meta.env.VITE_STRIPE_PRO_PRICE_ID
						: import.meta.env.VITE_STRIPE_TEAM_PRICE_ID;

				const response = await fetch('/api/stripe/checkout', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ priceId, plan: selectedPlan })
				});

				const data = await response.json();

				if (data.url) {
					window.location.href = data.url;
				} else {
					throw new Error('No checkout URL received');
				}
			} else {
				// Paystack
				const plan = plans[selectedPlan];
				const amount = plan.price.paystack;

				const response = await fetch('/api/paystack/initialize', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ amount, plan: selectedPlan })
				});

				const data = await response.json();

				if (data.authorizationUrl) {
					window.location.href = data.authorizationUrl;
				} else {
					throw new Error('No authorization URL received');
				}
			}
		} catch (error) {
			console.error('Failed to initiate upgrade:', error);
			toast.error('Failed to start checkout process. Please try again.');
			isLoading = false;
		}
	}

	function formatPrice(plan: PlanId): string {
		const planData = plans[plan];
		if (paymentProvider === 'stripe') {
			return `$${planData.price.stripe}/mo`;
		} else {
			return `₦${planData.price.paystack.toLocaleString()}/mo`;
		}
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Upgrade Your Plan</DialogTitle>
		</DialogHeader>

		<div class="space-y-6">
			<!-- Payment Provider Toggle -->
			<div class="flex justify-center gap-4">
				<Button
					variant={paymentProvider === 'stripe' ? 'default' : 'outline'}
					onclick={() => (paymentProvider = 'stripe')}
				>
					Stripe (USD)
				</Button>
				<Button
					variant={paymentProvider === 'paystack' ? 'default' : 'outline'}
					onclick={() => (paymentProvider = 'paystack')}
				>
					Paystack (NGN)
				</Button>
			</div>

			<!-- Plan Selection -->
			<RadioGroup bind:value={selectedPlan}>
				<div class="grid md:grid-cols-2 gap-6">
					{#each availablePlans as planId}
						{@const plan = plans[planId]}
						<div
							class={{
                'relative border rounded-lg p-6 cursor-pointer transition-all hover:border-primary': true,
                'border-primary bg-primary/5': selectedPlan === planId
              }}

							onclick={() => (selectedPlan = planId)}
						>
							<div class="flex items-start gap-3">
								<RadioGroupItem value={planId} id={planId} />
								<Label for={planId} class="flex-1 cursor-pointer">
									<div class="space-y-3">
										<div class="flex items-center justify-between">
											<h3 class="text-xl font-semibold">{plan.name}</h3>
											<div class="text-2xl font-bold">{formatPrice(planId)}</div>
										</div>

										<ul class="space-y-2">
											{#each plan.features as feature}
												<li class="flex items-start gap-2 text-sm">
													<Check class="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
													<span>{feature}</span>
												</li>
											{/each}
										</ul>
									</div>
								</Label>
							</div>
						</div>
					{/each}
				</div>
			</RadioGroup>

			<!-- Actions -->
			<div class="flex justify-end gap-3">
				<Button variant="outline" onclick={() => (open = false)} disabled={isLoading}>
					Cancel
				</Button>
				<Button onclick={handleUpgrade} disabled={isLoading}>
					{#if isLoading}
						Processing...
					{:else}
						Upgrade to {plans[selectedPlan].name}
					{/if}
				</Button>
			</div>
		</div>
	</DialogContent>
</Dialog>
