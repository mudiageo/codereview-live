<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import TrendingDown from '@lucide/svelte/icons/trending-down';
	import Users from '@lucide/svelte/icons/users';
	import FileVideo from '@lucide/svelte/icons/file-video';
	import Clock from '@lucide/svelte/icons/clock';
	import Bug from '@lucide/svelte/icons/bug';
	import Zap from '@lucide/svelte/icons/zap';
	import Target from '@lucide/svelte/icons/target';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
	import PieChart from '@lucide/svelte/icons/pie-chart';
	import Activity from '@lucide/svelte/icons/activity';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import Eye from '@lucide/svelte/icons/eye';
	import Star from '@lucide/svelte/icons/star';
	import Award from '@lucide/svelte/icons/award';
	import Flame from '@lucide/svelte/icons/flame';
	import Calendar from '@lucide/svelte/icons/calendar';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import ArrowDownRight from '@lucide/svelte/icons/arrow-down-right';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import FileCode from '@lucide/svelte/icons/file-code';
	import FolderTree from '@lucide/svelte/icons/folder-tree';
	import { reviewsStore, commentsStore, teamsStore, aiUsageStore } from '$lib/stores/index.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';

	let loading = $state(true);
	let timeRange = $state('30d');
	let activeTab = $state('overview');

	// Simulated analytics data - in production, this would come from API/store
	const teamInsights = $state({
		mostReviewedFiles: [
			{ path: 'src/lib/auth/session.ts', reviews: 47, trend: 12 },
			{ path: 'src/api/payments/stripe.ts', reviews: 38, trend: -3 },
			{ path: 'src/components/Dashboard.tsx', reviews: 35, trend: 8 },
			{ path: 'src/utils/validation.ts', reviews: 29, trend: 5 },
			{ path: 'src/hooks/useAuth.ts', reviews: 24, trend: -1 }
		],
		fastestReviewers: [
			{ name: 'Sarah Chen', avatar: '', avgTime: 12, reviews: 34, streak: 7 },
			{ name: 'Mike Johnson', avatar: '', avgTime: 18, reviews: 28, streak: 5 },
			{ name: 'Emily Davis', avatar: '', avgTime: 22, reviews: 41, streak: 12 },
			{ name: 'Alex Kim', avatar: '', avgTime: 25, reviews: 19, streak: 3 }
		],
		reviewDistribution: {
			frontend: 42,
			backend: 31,
			infrastructure: 15,
			documentation: 12
		}
	});

	const codeQualityTrends = $state({
		smellReduction: [
			{ month: 'Jul', smells: 89 },
			{ month: 'Aug', smells: 76 },
			{ month: 'Sep', smells: 64 },
			{ month: 'Oct', smells: 52 },
			{ month: 'Nov', smells: 41 },
			{ month: 'Dec', smells: 35 }
		],
		currentSmells: 35,
		previousSmells: 41,
		topSmellTypes: [
			{ type: 'Long Methods', count: 12, change: -4 },
			{ type: 'Duplicate Code', count: 8, change: -2 },
			{ type: 'Complex Conditionals', count: 7, change: -1 },
			{ type: 'Dead Code', count: 5, change: -3 },
			{ type: 'Magic Numbers', count: 3, change: 0 }
		],
		securityIssuesFixed: 23,
		performanceImprovements: 18
	});

	const reviewEffectiveness = $state({
		videoVsTextReviews: {
			video: { bugsCaught: 156, avgResolutionTime: 2.4, satisfactionScore: 4.7 },
			text: { bugsCaught: 89, avgResolutionTime: 4.1, satisfactionScore: 3.9 }
		},
		bugReductionCorrelation: 0.78,
		reviewImpactMetrics: [
			{ metric: 'Bugs caught pre-production', value: 156, change: 23 },
			{ metric: 'Security vulnerabilities prevented', value: 12, change: 5 },
			{ metric: 'Performance issues identified', value: 34, change: 8 },
			{ metric: 'Documentation gaps found', value: 28, change: -2 }
		],
		weeklyBugTrend: [
			{ week: 'W1', bugs: 18, reviews: 24 },
			{ week: 'W2', bugs: 14, reviews: 28 },
			{ week: 'W3', bugs: 11, reviews: 32 },
			{ week: 'W4', bugs: 8, reviews: 35 }
		]
	});

	const personalStats = $state({
		totalReviews: 47,
		totalWatchTime: 312, // minutes
		avgReviewLength: 6.4, // minutes
		topicsStrength: [
			{ topic: 'Authentication', score: 92 },
			{ topic: 'API Design', score: 87 },
			{ topic: 'React Patterns', score: 84 },
			{ topic: 'Database Queries', score: 78 },
			{ topic: 'Testing', score: 71 }
		],
		reviewStyle: {
			thoroughness: 88,
			clarity: 92,
			actionability: 85,
			timeliness: 79
		},
		achievements: [
			{ name: 'Bug Hunter', description: 'Found 50+ bugs in reviews', unlocked: true, icon: Bug },
			{ name: 'Speed Demon', description: 'Average review time under 15 min', unlocked: true, icon: Zap },
			{ name: 'Consistency King', description: '30-day review streak', unlocked: false, icon: Flame },
			{ name: 'Team Player', description: 'Helped 10+ teammates', unlocked: true, icon: Users }
		],
		recentActivity: [
			{ type: 'review', title: 'Auth refactor PR #234', time: '2 hours ago' },
			{ type: 'comment', title: 'Suggested async improvement', time: '4 hours ago' },
			{ type: 'resolved', title: 'Fixed memory leak issue', time: 'Yesterday' }
		]
	});

	// Interactive code map data
	const codeMap = $state({
		nodes: [
			{ id: 'auth', name: 'Authentication', reviews: 47, connections: ['api', 'db'] },
			{ id: 'api', name: 'API Layer', reviews: 38, connections: ['auth', 'services'] },
			{ id: 'services', name: 'Services', reviews: 29, connections: ['api', 'db'] },
			{ id: 'db', name: 'Database', reviews: 24, connections: ['auth', 'services'] },
			{ id: 'ui', name: 'UI Components', reviews: 35, connections: ['hooks', 'utils'] },
			{ id: 'hooks', name: 'Hooks', reviews: 24, connections: ['ui', 'services'] },
			{ id: 'utils', name: 'Utilities', reviews: 29, connections: ['ui', 'services'] }
		]
	});

	onMount(() => {
		// Simulate loading
		setTimeout(() => {
			loading = false;
		}, 800);
	});

	function getInitials(name: string) {
		return name.split(' ').map(n => n[0]).join('').toUpperCase();
	}

	function formatTime(minutes: number) {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	}

	const smellReductionPercent = $derived(
		Math.round(((codeQualityTrends.previousSmells - codeQualityTrends.currentSmells) / codeQualityTrends.previousSmells) * 100)
	);

	const maxSmellValue = $derived(Math.max(...codeQualityTrends.smellReduction.map(d => d.smells)));
</script>

<svelte:head>
	<title>Analytics | CodeReview.live</title>
</svelte:head>

<div class="space-y-6 pb-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
				Analytics Dashboard
			</h1>
			<p class="text-muted-foreground mt-1">
				Data-driven insights to measure and improve your code review impact
			</p>
		</div>
		<div class="flex items-center gap-3">
			<Select type="single" bind:value={timeRange}>
				<SelectTrigger class="w-[140px]">
					<Calendar class="h-4 w-4 mr-2" />
					{timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : timeRange === '90d' ? 'Last 90 days' : 'This year'}
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="7d">Last 7 days</SelectItem>
					<SelectItem value="30d">Last 30 days</SelectItem>
					<SelectItem value="90d">Last 90 days</SelectItem>
					<SelectItem value="1y">This year</SelectItem>
				</SelectContent>
			</Select>
		</div>
	</div>

	<!-- Quick Stats Row -->
	{#if loading}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{#each Array(4) as _}
				<Card>
					<CardHeader class="pb-2">
						<Skeleton class="h-4 w-24" />
					</CardHeader>
					<CardContent>
						<Skeleton class="h-8 w-16 mb-2" />
						<Skeleton class="h-3 w-32" />
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card class="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
				<div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium">Total Reviews</CardTitle>
					<FileVideo class="h-4 w-4 text-blue-500" />
				</CardHeader>
				<CardContent>
					<div class="text-3xl font-bold">{reviewsStore.count || 47}</div>
					<div class="flex items-center gap-1 text-xs text-emerald-600 mt-1">
						<ArrowUpRight class="h-3 w-3" />
						<span>+12% from last month</span>
					</div>
				</CardContent>
			</Card>

			<Card class="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
				<div class="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium">Bugs Prevented</CardTitle>
					<Bug class="h-4 w-4 text-emerald-500" />
				</CardHeader>
				<CardContent>
					<div class="text-3xl font-bold">{reviewEffectiveness.reviewImpactMetrics[0].value}</div>
					<div class="flex items-center gap-1 text-xs text-emerald-600 mt-1">
						<ArrowUpRight class="h-3 w-3" />
						<span>+{reviewEffectiveness.reviewImpactMetrics[0].change} this month</span>
					</div>
				</CardContent>
			</Card>

			<Card class="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
				<div class="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium">Code Smells</CardTitle>
					<Activity class="h-4 w-4 text-amber-500" />
				</CardHeader>
				<CardContent>
					<div class="text-3xl font-bold">{codeQualityTrends.currentSmells}</div>
					<div class="flex items-center gap-1 text-xs text-emerald-600 mt-1">
						<ArrowDownRight class="h-3 w-3" />
						<span>-{smellReductionPercent}% reduction</span>
					</div>
				</CardContent>
			</Card>

			<Card class="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
				<div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium">Review Impact Score</CardTitle>
					<Target class="h-4 w-4 text-purple-500" />
				</CardHeader>
				<CardContent>
					<div class="text-3xl font-bold">{Math.round(reviewEffectiveness.bugReductionCorrelation * 100)}%</div>
					<div class="flex items-center gap-1 text-xs text-muted-foreground mt-1">
						<span>Video review effectiveness</span>
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}

	<!-- Main Tabs -->
	<Tabs bind:value={activeTab} class="space-y-6">
		<TabsList class="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
			<TabsTrigger value="overview" class="gap-2">
				<BarChart3 class="h-4 w-4" />
				<span class="hidden sm:inline">Overview</span>
			</TabsTrigger>
			<TabsTrigger value="team" class="gap-2">
				<Users class="h-4 w-4" />
				<span class="hidden sm:inline">Team Insights</span>
			</TabsTrigger>
			<TabsTrigger value="quality" class="gap-2">
				<Activity class="h-4 w-4" />
				<span class="hidden sm:inline">Code Quality</span>
			</TabsTrigger>
			<TabsTrigger value="personal" class="gap-2">
				<Star class="h-4 w-4" />
				<span class="hidden sm:inline">My Stats</span>
			</TabsTrigger>
		</TabsList>

		<!-- Overview Tab -->
		<TabsContent value="overview" class="space-y-6">
			<div class="grid gap-6 lg:grid-cols-2">
				<!-- Video vs Text Reviews Comparison -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<PieChart class="h-5 w-5 text-primary" />
							Video vs Text Review Effectiveness
						</CardTitle>
						<CardDescription>
							Compare the impact of video reviews against traditional text comments
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="grid grid-cols-2 gap-4">
							<div class="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
								<div class="flex items-center gap-2 mb-3">
									<FileVideo class="h-5 w-5 text-blue-500" />
									<span class="font-semibold">Video Reviews</span>
								</div>
								<div class="space-y-2">
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">Bugs Caught</span>
										<span class="font-bold">{reviewEffectiveness.videoVsTextReviews.video.bugsCaught}</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">Avg Resolution</span>
										<span class="font-bold">{reviewEffectiveness.videoVsTextReviews.video.avgResolutionTime}h</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">Satisfaction</span>
										<span class="font-bold flex items-center gap-1">
											{reviewEffectiveness.videoVsTextReviews.video.satisfactionScore}
											<Star class="h-3 w-3 text-amber-500 fill-amber-500" />
										</span>
									</div>
								</div>
							</div>
							<div class="p-4 rounded-xl bg-gradient-to-br from-slate-500/10 to-slate-600/5 border border-slate-500/20">
								<div class="flex items-center gap-2 mb-3">
									<MessageSquare class="h-5 w-5 text-slate-500" />
									<span class="font-semibold">Text Reviews</span>
								</div>
								<div class="space-y-2">
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">Bugs Caught</span>
										<span class="font-bold">{reviewEffectiveness.videoVsTextReviews.text.bugsCaught}</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">Avg Resolution</span>
										<span class="font-bold">{reviewEffectiveness.videoVsTextReviews.text.avgResolutionTime}h</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">Satisfaction</span>
										<span class="font-bold flex items-center gap-1">
											{reviewEffectiveness.videoVsTextReviews.text.satisfactionScore}
											<Star class="h-3 w-3 text-amber-500 fill-amber-500" />
										</span>
									</div>
								</div>
							</div>
						</div>
						<div class="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
							<div class="flex items-center gap-2">
								<Sparkles class="h-5 w-5 text-emerald-500" />
								<span class="font-semibold text-emerald-700 dark:text-emerald-400">Video reviews catch {Math.round((reviewEffectiveness.videoVsTextReviews.video.bugsCaught / reviewEffectiveness.videoVsTextReviews.text.bugsCaught - 1) * 100)}% more bugs</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Bug Trend Chart -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<TrendingDown class="h-5 w-5 text-emerald-500" />
							Bug Reduction Trend
						</CardTitle>
						<CardDescription>
							Weekly correlation between reviews and bugs found in production
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							{#each reviewEffectiveness.weeklyBugTrend as week, i}
								<div class="flex items-center gap-4">
									<span class="w-8 text-sm text-muted-foreground">{week.week}</span>
									<div class="flex-1 space-y-1">
										<div class="flex items-center gap-2">
											<div class="h-2 rounded-full bg-blue-500" style="width: {(week.reviews / 40) * 100}%"></div>
											<span class="text-xs text-muted-foreground">{week.reviews} reviews</span>
										</div>
										<div class="flex items-center gap-2">
											<div class="h-2 rounded-full bg-red-500" style="width: {(week.bugs / 20) * 100}%"></div>
											<span class="text-xs text-muted-foreground">{week.bugs} bugs</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
						<div class="mt-4 pt-4 border-t flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Correlation coefficient</span>
							<Badge variant="outline" class="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
								-0.{Math.round(reviewEffectiveness.bugReductionCorrelation * 100)} (Strong inverse)
							</Badge>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Impact Metrics -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Target class="h-5 w-5 text-primary" />
						Review Impact Metrics
					</CardTitle>
					<CardDescription>
						Quantified benefits from video code reviews this period
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{#each reviewEffectiveness.reviewImpactMetrics as metric}
							<div class="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
								<div class="text-2xl font-bold">{metric.value}</div>
								<div class="text-sm text-muted-foreground mt-1">{metric.metric}</div>
								<div class="flex items-center gap-1 mt-2 text-xs {metric.change >= 0 ? 'text-emerald-600' : 'text-red-600'}">
									{#if metric.change >= 0}
										<ArrowUpRight class="h-3 w-3" />
									{:else}
										<ArrowDownRight class="h-3 w-3" />
									{/if}
									<span>{metric.change >= 0 ? '+' : ''}{metric.change} this month</span>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		</TabsContent>

		<!-- Team Insights Tab -->
		<TabsContent value="team" class="space-y-6">
			<div class="grid gap-6 lg:grid-cols-2">
				<!-- Most Reviewed Files -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<FileCode class="h-5 w-5 text-primary" />
							Most Reviewed Files
						</CardTitle>
						<CardDescription>
							Files that receive the most attention in code reviews
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							{#each teamInsights.mostReviewedFiles as file, i}
								<div class="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
									<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
										{i + 1}
									</div>
									<div class="flex-1 min-w-0">
										<div class="font-mono text-sm truncate">{file.path}</div>
										<div class="text-xs text-muted-foreground">{file.reviews} reviews</div>
									</div>
									<div class="flex items-center gap-1 text-xs {file.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}">
										{#if file.trend >= 0}
											<ArrowUpRight class="h-3 w-3" />
										{:else}
											<ArrowDownRight class="h-3 w-3" />
										{/if}
										<span>{file.trend >= 0 ? '+' : ''}{file.trend}</span>
									</div>
									<ChevronRight class="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>

				<!-- Fastest Reviewers -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Zap class="h-5 w-5 text-amber-500" />
							Fastest Reviewers
						</CardTitle>
						<CardDescription>
							Team members with the quickest average review turnaround
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							{#each teamInsights.fastestReviewers as reviewer, i}
								<div class="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
									<div class="relative">
										<Avatar class="h-10 w-10">
											<AvatarImage src={reviewer.avatar} />
											<AvatarFallback class="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
												{getInitials(reviewer.name)}
											</AvatarFallback>
										</Avatar>
										{#if i === 0}
											<div class="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
												<Award class="h-3 w-3 text-white" />
											</div>
										{/if}
									</div>
									<div class="flex-1">
										<div class="font-medium">{reviewer.name}</div>
										<div class="text-xs text-muted-foreground">{reviewer.reviews} reviews</div>
									</div>
									<div class="text-right">
										<div class="font-bold text-primary">{reviewer.avgTime}min</div>
										<div class="flex items-center gap-1 text-xs text-muted-foreground">
											<Flame class="h-3 w-3 text-orange-500" />
											{reviewer.streak} day streak
										</div>
									</div>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Review Distribution -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<FolderTree class="h-5 w-5 text-primary" />
						Review Distribution by Area
					</CardTitle>
					<CardDescription>
						Breakdown of reviews across different parts of the codebase
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{#each Object.entries(teamInsights.reviewDistribution) as [area, percentage]}
							<div class="p-4 rounded-xl border bg-card">
								<div class="flex items-center justify-between mb-3">
									<span class="font-medium capitalize">{area}</span>
									<span class="text-2xl font-bold">{percentage}%</span>
								</div>
								<Progress value={percentage} class="h-2" />
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>

			<!-- Interactive Code Map Placeholder -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<GitBranch class="h-5 w-5 text-primary" />
						Interactive Code Map
					</CardTitle>
					<CardDescription>
						Visual graph showing which files and functions were reviewed
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="relative h-64 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
						<!-- Simplified code map visualization -->
						<svg class="w-full h-full" viewBox="0 0 400 200">
							<!-- Connections -->
							<line x1="100" y1="60" x2="200" y2="100" stroke="currentColor" stroke-opacity="0.2" stroke-width="2" />
							<line x1="200" y1="100" x2="300" y2="60" stroke="currentColor" stroke-opacity="0.2" stroke-width="2" />
							<line x1="200" y1="100" x2="200" y2="160" stroke="currentColor" stroke-opacity="0.2" stroke-width="2" />
							<line x1="100" y1="140" x2="200" y2="160" stroke="currentColor" stroke-opacity="0.2" stroke-width="2" />
							<line x1="300" y1="140" x2="200" y2="160" stroke="currentColor" stroke-opacity="0.2" stroke-width="2" />

							<!-- Nodes -->
							{#each codeMap.nodes as node, i}
								{@const positions = [
									{ x: 100, y: 60 },
									{ x: 200, y: 100 },
									{ x: 300, y: 60 },
									{ x: 100, y: 140 },
									{ x: 300, y: 140 },
									{ x: 200, y: 160 },
									{ x: 50, y: 100 }
								]}
								{@const pos = positions[i] || { x: 200, y: 100 }}
								<g class="cursor-pointer hover:scale-110 transition-transform" style="transform-origin: {pos.x}px {pos.y}px">
									<circle
										cx={pos.x}
										cy={pos.y}
										r={15 + node.reviews / 5}
										fill="url(#nodeGradient{i})"
										class="opacity-80"
									/>
									<text
										x={pos.x}
										y={pos.y + 30}
										text-anchor="middle"
										class="fill-white text-xs font-medium"
									>
										{node.name}
									</text>
									<text
										x={pos.x}
										y={pos.y + 5}
										text-anchor="middle"
										class="fill-white text-xs font-bold"
									>
										{node.reviews}
									</text>
								</g>
								<defs>
									<radialGradient id="nodeGradient{i}">
										<stop offset="0%" stop-color="hsl(var(--primary))" />
										<stop offset="100%" stop-color="hsl(var(--primary) / 0.5)" />
									</radialGradient>
								</defs>
							{/each}
						</svg>
						<div class="absolute bottom-4 left-4 text-xs text-white/60">
							Node size = review count • Click to explore
						</div>
					</div>
				</CardContent>
			</Card>
		</TabsContent>

		<!-- Code Quality Tab -->
		<TabsContent value="quality" class="space-y-6">
			<!-- Code Smell Reduction Chart -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<TrendingDown class="h-5 w-5 text-emerald-500" />
						Code Smell Reduction Over Time
					</CardTitle>
					<CardDescription>
						Track how code quality has improved through consistent reviews
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="h-48 flex items-end gap-2">
						{#each codeQualityTrends.smellReduction as data, i}
							<div class="flex-1 flex flex-col items-center gap-2">
								<div
									class="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-400 transition-all duration-500 hover:from-amber-400 hover:to-amber-300"
									style="height: {(data.smells / maxSmellValue) * 100}%"
								></div>
								<span class="text-xs text-muted-foreground">{data.month}</span>
								<span class="text-xs font-medium">{data.smells}</span>
							</div>
						{/each}
					</div>
					<div class="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Sparkles class="h-5 w-5 text-emerald-500" />
							<span class="font-medium text-emerald-700 dark:text-emerald-400">
								{smellReductionPercent}% reduction in code smells this period
							</span>
						</div>
						<Badge variant="outline" class="bg-emerald-500/10 text-emerald-600">
							-{codeQualityTrends.previousSmells - codeQualityTrends.currentSmells} smells
						</Badge>
					</div>
				</CardContent>
			</Card>

			<div class="grid gap-6 lg:grid-cols-2">
				<!-- Top Smell Types -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Bug class="h-5 w-5 text-amber-500" />
							Top Code Smell Types
						</CardTitle>
						<CardDescription>
							Most common issues identified in reviews
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							{#each codeQualityTrends.topSmellTypes as smell}
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<span class="font-medium">{smell.type}</span>
										<div class="flex items-center gap-2">
											<span class="text-sm font-bold">{smell.count}</span>
											{#if smell.change !== 0}
												<span class="text-xs {smell.change < 0 ? 'text-emerald-600' : 'text-red-600'}">
													{smell.change < 0 ? '' : '+'}{smell.change}
												</span>
											{/if}
										</div>
									</div>
									<Progress value={(smell.count / 15) * 100} class="h-2" />
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>

				<!-- Quick Wins -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Award class="h-5 w-5 text-primary" />
							Quality Achievements
						</CardTitle>
						<CardDescription>
							Key improvements from video code reviews
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
							<div class="flex items-center gap-3">
								<div class="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
									<Bug class="h-6 w-6 text-emerald-500" />
								</div>
								<div>
									<div class="text-2xl font-bold">{codeQualityTrends.securityIssuesFixed}</div>
									<div class="text-sm text-muted-foreground">Security issues fixed</div>
								</div>
							</div>
						</div>
						<div class="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
							<div class="flex items-center gap-3">
								<div class="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
									<Zap class="h-6 w-6 text-blue-500" />
								</div>
								<div>
									<div class="text-2xl font-bold">{codeQualityTrends.performanceImprovements}</div>
									<div class="text-sm text-muted-foreground">Performance improvements</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</TabsContent>

		<!-- Personal Stats Tab -->
		<TabsContent value="personal" class="space-y-6">
			<div class="grid gap-6 lg:grid-cols-3">
				<!-- Personal Overview -->
				<Card class="lg:col-span-2">
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Star class="h-5 w-5 text-amber-500" />
							Your Review Style Analysis
						</CardTitle>
						<CardDescription>
							AI-powered insights into your reviewing patterns
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<!-- Style Metrics -->
						<div class="grid grid-cols-2 gap-4">
							{#each Object.entries(personalStats.reviewStyle) as [metric, value]}
								<div class="space-y-2">
									<div class="flex items-center justify-between text-sm">
										<span class="capitalize text-muted-foreground">{metric}</span>
										<span class="font-bold">{value}%</span>
									</div>
									<div class="h-2 rounded-full bg-muted overflow-hidden">
										<div
											class="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
											style="width: {value}%"
										></div>
									</div>
								</div>
							{/each}
						</div>

						<!-- Topic Strengths -->
						<div>
							<h4 class="font-medium mb-3">Your Strong Topics</h4>
							<div class="flex flex-wrap gap-2">
								{#each personalStats.topicsStrength as topic}
									<Badge
										variant="outline"
										class="px-3 py-1.5 {topic.score >= 85 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : topic.score >= 75 ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}"
									>
										{topic.topic}
										<span class="ml-1 font-bold">{topic.score}</span>
									</Badge>
								{/each}
							</div>
						</div>

						<!-- Quick Stats -->
						<div class="grid grid-cols-3 gap-4">
							<div class="text-center p-4 rounded-xl bg-muted/50">
								<div class="text-2xl font-bold">{personalStats.totalReviews}</div>
								<div class="text-xs text-muted-foreground">Total Reviews</div>
							</div>
							<div class="text-center p-4 rounded-xl bg-muted/50">
								<div class="text-2xl font-bold">{formatTime(personalStats.totalWatchTime)}</div>
								<div class="text-xs text-muted-foreground">Time Invested</div>
							</div>
							<div class="text-center p-4 rounded-xl bg-muted/50">
								<div class="text-2xl font-bold">{personalStats.avgReviewLength}m</div>
								<div class="text-xs text-muted-foreground">Avg Length</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Achievements -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Award class="h-5 w-5 text-primary" />
							Achievements
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							{#each personalStats.achievements as achievement}
								<div class="flex items-center gap-3 p-3 rounded-lg {achievement.unlocked ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30 opacity-60'}">
									<div class="h-10 w-10 rounded-full {achievement.unlocked ? 'bg-primary/20' : 'bg-muted'} flex items-center justify-center">
										<svelte:component this={achievement.icon} class="h-5 w-5 {achievement.unlocked ? 'text-primary' : 'text-muted-foreground'}" />
									</div>
									<div class="flex-1">
										<div class="font-medium text-sm">{achievement.name}</div>
										<div class="text-xs text-muted-foreground">{achievement.description}</div>
									</div>
									{#if achievement.unlocked}
										<Badge variant="outline" class="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
											Unlocked
										</Badge>
									{/if}
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Recent Activity -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Activity class="h-5 w-5 text-primary" />
						Recent Activity
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each personalStats.recentActivity as activity}
							<div class="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
								<div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
									{#if activity.type === 'review'}
										<FileVideo class="h-4 w-4 text-primary" />
									{:else if activity.type === 'comment'}
										<MessageSquare class="h-4 w-4 text-blue-500" />
									{:else}
										<Bug class="h-4 w-4 text-emerald-500" />
									{/if}
								</div>
								<div class="flex-1">
									<div class="font-medium text-sm">{activity.title}</div>
									<div class="text-xs text-muted-foreground">{activity.time}</div>
								</div>
								<ChevronRight class="h-4 w-4 text-muted-foreground" />
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
