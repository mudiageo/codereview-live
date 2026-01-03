<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import ShieldAlert from '@lucide/svelte/icons/shield-alert';
	import Zap from '@lucide/svelte/icons/zap';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import Bug from '@lucide/svelte/icons/bug';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import { toast } from 'svelte-sonner';
	import { settingsStore } from '$lib/stores/index.svelte';
	import type {
		CodeAnalysis,
		BugReport,
		Suggestion,
		SecurityIssue,
		PerformanceNote,
		CodeSmell
	} from '$lib/server/ai';

	interface Props {
		analysis: CodeAnalysis | null;
		loading?: boolean;
		onAnalyze?: () => void;
		code?: string;
	}

	let { analysis, loading = false, onAnalyze, code }: Props = $props();
	
	// Check if AI features are enabled
	const aiEnabled = $derived(settingsStore.settings.aiEnabled);
	const detectSmells = $derived(settingsStore.settings.detectSmells);
	const suggestImprovements = $derived(settingsStore.settings.suggestImprovements);

	let activeTab = $state('overview');
	let expandedItems = $state<Set<string>>(new Set());
	let copiedId = $state<string | null>(null);

	function toggleExpand(id: string) {
		const newSet = new Set(expandedItems);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		expandedItems = newSet;
	}

	function getSeverityColor(severity: string) {
		switch (severity) {
			case 'critical':
				return 'bg-red-500/10 text-red-500 border-red-500/20';
			case 'high':
				return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
			case 'medium':
				return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
			case 'low':
				return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
			default:
				return 'bg-muted text-muted-foreground';
		}
	}

	function getImpactColor(impact: string) {
		switch (impact) {
			case 'high':
				return 'bg-emerald-500/10 text-emerald-500';
			case 'medium':
				return 'bg-blue-500/10 text-blue-500';
			case 'low':
				return 'bg-slate-500/10 text-slate-500';
			default:
				return 'bg-muted text-muted-foreground';
		}
	}

	async function copyCode(code: string, id: string) {
		await navigator.clipboard.writeText(code);
		copiedId = id;
		toast.success('Copied to clipboard');
		setTimeout(() => (copiedId = null), 2000);
	}

	const totalIssues = $derived(
		(analysis?.bugs?.length || 0) +
			(analysis?.securityIssues?.length || 0) +
			(analysis?.codeSmells?.length || 0)
	);

	const criticalCount = $derived(
		(analysis?.bugs?.filter((b) => b.severity === 'critical').length || 0) +
			(analysis?.securityIssues?.filter((s) => s.severity === 'critical').length || 0)
	);
</script>

{#if !aiEnabled}
	<!-- AI Features Disabled -->
	<Card class="border-dashed">
		<CardContent class="py-8 text-center">
			<Sparkles class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
			<h3 class="font-semibold mb-2">AI Features Disabled</h3>
			<p class="text-sm text-muted-foreground mb-4">
				Enable AI features in settings to use code analysis
			</p>
			<Button variant="outline" onclick={() => window.location.href = '/settings/ai'}>
				Go to AI Settings
			</Button>
		</CardContent>
	</Card>
{:else}
<div class="space-y-4">
	{#if loading}
		<!-- Loading State -->
		<Card class="overflow-hidden">
			<CardHeader class="pb-2">
				<div class="flex items-center gap-2">
					<Sparkles class="h-5 w-5 text-primary animate-pulse" />
					<Skeleton class="h-5 w-40" />
				</div>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex items-center gap-4">
					<Skeleton class="h-16 w-16 rounded-full" />
					<div class="space-y-2 flex-1">
						<Skeleton class="h-4 w-3/4" />
						<Skeleton class="h-3 w-1/2" />
					</div>
				</div>
				<div class="grid grid-cols-4 gap-2">
					{#each Array(4) as _}
						<Skeleton class="h-20 rounded-lg" />
					{/each}
				</div>
				<div class="space-y-2">
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-2/3" />
				</div>
			</CardContent>
		</Card>
	{:else if !analysis}
		<!-- Empty State -->
		<Card class="overflow-hidden border-dashed">
			<CardContent class="flex flex-col items-center justify-center py-12 text-center">
				<div class="rounded-full bg-primary/10 p-4 mb-4">
					<Sparkles class="h-8 w-8 text-primary" />
				</div>
				<h3 class="text-lg font-semibold mb-2">AI Code Analysis</h3>
				<p class="text-sm text-muted-foreground mb-4 max-w-xs">
					Let AI analyze your code for bugs, security issues, and improvement opportunities.
				</p>
				{#if onAnalyze}
					<Button onclick={onAnalyze} disabled={!code} class="gap-2">
						<Sparkles class="h-4 w-4" />
						Analyze Code
					</Button>
				{/if}
			</CardContent>
		</Card>
	{:else}
		<!-- Analysis Results -->
		<Card class="overflow-hidden">
			<CardHeader class="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
				<div class="flex items-center justify-between">
					<CardTitle class="flex items-center gap-2 text-lg">
						<Sparkles class="h-5 w-5 text-primary" />
						AI Analysis Complete
					</CardTitle>
					<div class="flex items-center gap-2">
						<Badge
							variant="outline"
							class={analysis.overallScore >= 80
								? 'bg-green-500/10 text-green-500'
								: analysis.overallScore >= 60
									? 'bg-yellow-500/10 text-yellow-500'
									: 'bg-red-500/10 text-red-500'}
						>
							Score: {analysis.overallScore}/100
						</Badge>
						{#if analysis.reviewTime}
							<Badge variant="outline" class="bg-blue-500/10 text-blue-500">
								~{analysis.reviewTime}min saved
							</Badge>
						{/if}
					</div>
				</div>
			</CardHeader>

			<CardContent class="pt-4 space-y-4">
				<!-- Summary -->
				<div class="rounded-lg bg-muted/50 p-4 border">
					<p class="text-sm leading-relaxed">{analysis.summary}</p>
				</div>

				<!-- Quick Stats -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
					<button
						class="flex flex-col items-center p-3 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/10 hover:border-red-500/30 transition-colors cursor-pointer"
						onclick={() => (activeTab = 'bugs')}
					>
						<Bug class="h-5 w-5 text-red-500 mb-1" />
						<span class="text-lg font-bold text-red-500">{analysis.bugs?.length || 0}</span>
						<span class="text-xs text-muted-foreground">Bugs</span>
					</button>
					<button
						class="flex flex-col items-center p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/10 hover:border-orange-500/30 transition-colors cursor-pointer"
						onclick={() => (activeTab = 'security')}
					>
						<ShieldAlert class="h-5 w-5 text-orange-500 mb-1" />
						<span class="text-lg font-bold text-orange-500"
							>{analysis.securityIssues?.length || 0}</span
						>
						<span class="text-xs text-muted-foreground">Security</span>
					</button>
					<button
						class="flex flex-col items-center p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/10 hover:border-yellow-500/30 transition-colors cursor-pointer"
						onclick={() => (activeTab = 'performance')}
					>
						<Zap class="h-5 w-5 text-yellow-500 mb-1" />
						<span class="text-lg font-bold text-yellow-500"
							>{analysis.performanceNotes?.length || 0}</span
						>
						<span class="text-xs text-muted-foreground">Performance</span>
					</button>
					<button
						class="flex flex-col items-center p-3 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-colors cursor-pointer"
						onclick={() => (activeTab = 'suggestions')}
					>
						<Lightbulb class="h-5 w-5 text-emerald-500 mb-1" />
						<span class="text-lg font-bold text-emerald-500"
							>{analysis.suggestions?.length || 0}</span
						>
						<span class="text-xs text-muted-foreground">Ideas</span>
					</button>
				</div>

				<!-- Detailed Tabs -->
				<Tabs bind:value={activeTab} class="w-full">
					<TabsList class="w-full grid grid-cols-4 h-9">
						<TabsTrigger value="overview" class="text-xs">Overview</TabsTrigger>
						<TabsTrigger value="bugs" class="text-xs">Bugs</TabsTrigger>
						<TabsTrigger value="security" class="text-xs">Security</TabsTrigger>
						<TabsTrigger value="suggestions" class="text-xs">Ideas</TabsTrigger>
					</TabsList>

					<!-- Overview Tab -->
					<TabsContent value="overview" class="mt-4 space-y-3">
						{#if criticalCount > 0}
							<div
								class="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
							>
								<AlertTriangle class="h-5 w-5 text-red-500 shrink-0" />
								<span class="text-sm font-medium text-red-500">
									{criticalCount} critical issue{criticalCount > 1 ? 's' : ''} found
								</span>
							</div>
						{/if}

						<div class="prose prose-sm dark:prose-invert max-w-none">
							<p class="text-muted-foreground">{analysis.explanation}</p>
						</div>

						{#if analysis.codeSmells && analysis.codeSmells.length > 0}
							<div class="space-y-2">
								<h4 class="text-sm font-medium flex items-center gap-2">
									<AlertTriangle class="h-4 w-4 text-yellow-500" />
									Code Smells
								</h4>
								{#each analysis.codeSmells.slice(0, 3) as smell}
									<div class="text-sm p-2 rounded bg-muted/50 border">
										<span class="font-medium">{smell.type}:</span>
										<span class="text-muted-foreground ml-1">{smell.description}</span>
									</div>
								{/each}
							</div>
						{/if}
					</TabsContent>

					<!-- Bugs Tab -->
					<TabsContent value="bugs" class="mt-4 space-y-3">
						{#if !analysis.bugs || analysis.bugs.length === 0}
							<div class="text-center py-8 text-muted-foreground">
								<Bug class="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p>No bugs detected! 🎉</p>
							</div>
						{:else}
							{#each analysis.bugs as bug}
								<div
									class={[
										'rounded-lg border overflow-hidden',
										{ 'border-red-500/30': bug.severity === 'critical' || bug.severity === 'high' }
									]}
								>
									<button
										class="w-full p-3 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
										onclick={() => toggleExpand(bug.id)}
									>
										<Badge class={`${getSeverityColor(bug.severity)} shrink-0`}>
											{bug.severity}
										</Badge>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium">{bug.description}</p>
											{#if bug.line}
												<p class="text-xs text-muted-foreground mt-1">Line {bug.line}</p>
											{/if}
										</div>
										{#if expandedItems.has(bug.id)}
											<ChevronUp class="h-4 w-4 text-muted-foreground shrink-0" />
										{:else}
											<ChevronDown class="h-4 w-4 text-muted-foreground shrink-0" />
										{/if}
									</button>

									{#if expandedItems.has(bug.id)}
										<div class="px-3 pb-3 space-y-2 border-t bg-muted/20">
											<p class="text-sm text-muted-foreground pt-2">
												<strong>Fix:</strong>
												{bug.suggestion}
											</p>
											{#if bug.codeSnippet}
												<div class="relative">
													<pre class="text-xs p-2 rounded bg-background overflow-x-auto"><code
															>{bug.codeSnippet}</code
														></pre>
													<Button
														variant="ghost"
														size="icon"
														class="absolute top-1 right-1 h-6 w-6"
														onclick={() => copyCode(bug.codeSnippet!, bug.id)}
													>
														{#if copiedId === bug.id}
															<Check class="h-3 w-3" />
														{:else}
															<Copy class="h-3 w-3" />
														{/if}
													</Button>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						{/if}
					</TabsContent>

					<!-- Security Tab -->
					<TabsContent value="security" class="mt-4 space-y-3">
						{#if !analysis.securityIssues || analysis.securityIssues.length === 0}
							<div class="text-center py-8 text-muted-foreground">
								<ShieldAlert class="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p>No security issues found! 🔒</p>
							</div>
						{:else}
							{#each analysis.securityIssues as issue}
								<div
									class={[
										'rounded-lg border overflow-hidden',
										{
											'border-red-500/30':
												issue.severity === 'critical' || issue.severity === 'high'
										}
									]}
								>
									<button
										class="w-full p-3 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
										onclick={() => toggleExpand(issue.id)}
									>
										<Badge class={`${getSeverityColor(issue.severity)} shrink-0`}>
											{issue.severity}
										</Badge>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium">{issue.type}</p>
											<p class="text-xs text-muted-foreground mt-1">{issue.description}</p>
										</div>
										{#if issue.cweId}
											<Badge variant="outline" class="shrink-0 text-xs">{issue.cweId}</Badge>
										{/if}
									</button>

									{#if expandedItems.has(issue.id)}
										<div class="px-3 pb-3 border-t bg-muted/20">
											<p class="text-sm text-muted-foreground pt-2">
												<strong>Recommendation:</strong>
												{issue.recommendation}
											</p>
										</div>
									{/if}
								</div>
							{/each}
						{/if}
					</TabsContent>

					<!-- Suggestions Tab -->
					<TabsContent value="suggestions" class="mt-4 space-y-3">
						{#if !analysis.suggestions || analysis.suggestions.length === 0}
							<div class="text-center py-8 text-muted-foreground">
								<Lightbulb class="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p>No suggestions - code looks great! ✨</p>
							</div>
						{:else}
							{#each analysis.suggestions as suggestion}
								<div class="rounded-lg border overflow-hidden">
									<button
										class="w-full p-3 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
										onclick={() => toggleExpand(suggestion.id)}
									>
										<Badge class={`${getImpactColor(suggestion.impact)} shrink-0`}>
											{suggestion.impact}
										</Badge>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium">{suggestion.description}</p>
											<div class="flex items-center gap-2 mt-1">
												<Badge variant="outline" class="text-xs">{suggestion.type}</Badge>
												{#if suggestion.line}
													<span class="text-xs text-muted-foreground">Line {suggestion.line}</span>
												{/if}
											</div>
										</div>
										{#if suggestion.before && suggestion.after}
											{#if expandedItems.has(suggestion.id)}
												<ChevronUp class="h-4 w-4 text-muted-foreground shrink-0" />
											{:else}
												<ChevronDown class="h-4 w-4 text-muted-foreground shrink-0" />
											{/if}
										{/if}
									</button>

									{#if expandedItems.has(suggestion.id) && suggestion.before && suggestion.after}
										<div class="px-3 pb-3 border-t bg-muted/20 space-y-2">
											<div class="pt-2">
												<p class="text-xs font-medium text-muted-foreground mb-1">Before:</p>
												<pre class="text-xs p-2 rounded bg-red-500/10 overflow-x-auto"><code
														>{suggestion.before}</code
													></pre>
											</div>
											<div>
												<p class="text-xs font-medium text-muted-foreground mb-1">After:</p>
												<pre class="text-xs p-2 rounded bg-green-500/10 overflow-x-auto"><code
														>{suggestion.after}</code
													></pre>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						{/if}
					</TabsContent>
				</Tabs>

				<!-- Re-analyze Button -->
				{#if onAnalyze}
					<div class="flex justify-end pt-2 border-t">
						<Button variant="outline" size="sm" onclick={onAnalyze} class="gap-2">
							<Sparkles class="h-3 w-3" />
							Re-analyze
						</Button>
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
{/if}
