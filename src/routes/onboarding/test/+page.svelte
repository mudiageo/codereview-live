<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '$lib/components/ui/accordion';
	import { Input } from '$lib/components/ui/input';
	import Play from '@lucide/svelte/icons/play';
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import Circle from '@lucide/svelte/icons/circle';
	import Clock from '@lucide/svelte/icons/clock';
	import Users from '@lucide/svelte/icons/users';
	import FileVideo from '@lucide/svelte/icons/file-video';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Target from '@lucide/svelte/icons/target';
	import Rocket from '@lucide/svelte/icons/rocket';
	import Award from '@lucide/svelte/icons/award';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Search from '@lucide/svelte/icons/search';
	import Filter from '@lucide/svelte/icons/filter';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import FolderTree from '@lucide/svelte/icons/folder-tree';
	import FileCode from '@lucide/svelte/icons/file-code';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Star from '@lucide/svelte/icons/star';
	import Zap from '@lucide/svelte/icons/zap';
	import Shield from '@lucide/svelte/icons/shield';
	import Database from '@lucide/svelte/icons/database';
	import Layout from '@lucide/svelte/icons/layout';
	import Server from '@lucide/svelte/icons/server';
	import Lock from '@lucide/svelte/icons/lock';
	import Eye from '@lucide/svelte/icons/eye';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import { reviewsStore, teamsStore } from '$lib/stores/index.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let loading = $state(true);
	let activeTab = $state('progress');
	let searchQuery = $state('');
	let selectedModule = $state<string | null>(null);

	// Onboarding Progress Data
	const onboardingModules = $state([
		{
			id: 'getting-started',
			title: 'Getting Started',
			description: 'Learn the basics of CodeReview.live',
			icon: Rocket,
			color: 'blue',
			totalLessons: 5,
			completedLessons: 5,
			estimatedTime: 15,
			lessons: [
				{ id: 'gs-1', title: 'Welcome to CodeReview.live', completed: true, duration: 3 },
				{ id: 'gs-2', title: 'Creating Your First Project', completed: true, duration: 3 },
				{ id: 'gs-3', title: 'Navigating the Dashboard', completed: true, duration: 2 },
				{ id: 'gs-4', title: 'Understanding the Interface', completed: true, duration: 4 },
				{ id: 'gs-5', title: 'Setting Up Your Profile', completed: true, duration: 3 }
			]
		},
		{
			id: 'video-reviews',
			title: 'Video Review Basics',
			description: 'Master the art of video code reviews',
			icon: FileVideo,
			color: 'purple',
			totalLessons: 6,
			completedLessons: 4,
			estimatedTime: 25,
			lessons: [
				{ id: 'vr-1', title: 'Why Video Reviews Matter', completed: true, duration: 4, videoUrl: '#' },
				{ id: 'vr-2', title: 'Recording Your First Review', completed: true, duration: 5, videoUrl: '#' },
				{ id: 'vr-3', title: 'Screen Recording Tips', completed: true, duration: 4, videoUrl: '#' },
				{ id: 'vr-4', title: 'Adding Annotations', completed: true, duration: 4, videoUrl: '#' },
				{ id: 'vr-5', title: 'Using Picture-in-Picture', completed: false, duration: 4, videoUrl: '#' },
				{ id: 'vr-6', title: 'Publishing Your Review', completed: false, duration: 4, videoUrl: '#' }
			]
		},
		{
			id: 'code-analysis',
			title: 'Code Analysis',
			description: 'Understanding code quality and AI insights',
			icon: Sparkles,
			color: 'emerald',
			totalLessons: 5,
			completedLessons: 2,
			estimatedTime: 20,
			lessons: [
				{ id: 'ca-1', title: 'Importing Code from GitHub', completed: true, duration: 4 },
				{ id: 'ca-2', title: 'Using the Diff Viewer', completed: true, duration: 4 },
				{ id: 'ca-3', title: 'AI-Powered Analysis', completed: false, duration: 5 },
				{ id: 'ca-4', title: 'Understanding Code Smells', completed: false, duration: 4 },
				{ id: 'ca-5', title: 'Review Checklists', completed: false, duration: 3 }
			]
		},
		{
			id: 'collaboration',
			title: 'Team Collaboration',
			description: 'Work effectively with your team',
			icon: Users,
			color: 'amber',
			totalLessons: 4,
			completedLessons: 0,
			estimatedTime: 15,
			lessons: [
				{ id: 'tc-1', title: 'Inviting Team Members', completed: false, duration: 3 },
				{ id: 'tc-2', title: 'Commenting & Discussions', completed: false, duration: 4 },
				{ id: 'tc-3', title: 'Mentions & Notifications', completed: false, duration: 4 },
				{ id: 'tc-4', title: 'Sharing Reviews', completed: false, duration: 4 }
			]
		},
		{
			id: 'advanced',
			title: 'Advanced Features',
			description: 'Power user techniques and integrations',
			icon: Zap,
			color: 'rose',
			totalLessons: 5,
			completedLessons: 0,
			estimatedTime: 30,
			lessons: [
				{ id: 'af-1', title: 'Keyboard Shortcuts', completed: false, duration: 4 },
				{ id: 'af-2', title: 'CI/CD Integration', completed: false, duration: 8 },
				{ id: 'af-3', title: 'Custom Checklist Templates', completed: false, duration: 6 },
				{ id: 'af-4', title: 'API & Webhooks', completed: false, duration: 8 },
				{ id: 'af-5', title: 'Analytics Deep Dive', completed: false, duration: 4 }
			]
		}
	]);

	// Beginner Review Templates
	const reviewTemplates = $state([
		{
			id: 'first-review',
			title: 'Your First Code Review',
			description: 'A guided walkthrough for first-time reviewers',
			difficulty: 'beginner',
			estimatedTime: 10,
			icon: GraduationCap,
			steps: [
				'Start by reading the PR description',
				'Look at the file changes overview',
				'Check for obvious bugs or typos',
				'Review naming conventions',
				'Leave constructive comments',
				'Record your video summary'
			],
			tags: ['fundamentals', 'guided']
		},
		{
			id: 'security-review',
			title: 'Security-Focused Review',
			description: 'Template for reviewing security-critical code',
			difficulty: 'intermediate',
			estimatedTime: 20,
			icon: Shield,
			steps: [
				'Check for input validation',
				'Review authentication flows',
				'Look for SQL injection risks',
				'Verify XSS prevention',
				'Check sensitive data handling',
				'Review API authorization',
				'Document security concerns'
			],
			tags: ['security', 'auth', 'validation']
		},
		{
			id: 'performance-review',
			title: 'Performance Review',
			description: 'Optimize code for speed and efficiency',
			difficulty: 'intermediate',
			estimatedTime: 15,
			icon: Zap,
			steps: [
				'Identify N+1 queries',
				'Check for unnecessary re-renders',
				'Review caching strategies',
				'Look for memory leaks',
				'Analyze async patterns',
				'Check bundle size impact'
			],
			tags: ['performance', 'optimization']
		},
		{
			id: 'frontend-review',
			title: 'Frontend Component Review',
			description: 'Review React/Svelte components effectively',
			difficulty: 'beginner',
			estimatedTime: 12,
			icon: Layout,
			steps: [
				'Check component structure',
				'Review prop types/interfaces',
				'Verify accessibility (a11y)',
				'Check responsive design',
				'Review state management',
				'Look for code duplication'
			],
			tags: ['frontend', 'components', 'react', 'svelte']
		},
		{
			id: 'api-review',
			title: 'API Endpoint Review',
			description: 'Best practices for backend API reviews',
			difficulty: 'intermediate',
			estimatedTime: 18,
			icon: Server,
			steps: [
				'Verify HTTP methods & status codes',
				'Check request validation',
				'Review error handling',
				'Validate response formats',
				'Check rate limiting',
				'Review database transactions',
				'Test edge cases'
			],
			tags: ['backend', 'api', 'rest']
		},
		{
			id: 'database-review',
			title: 'Database Migration Review',
			description: 'Safe database schema changes',
			difficulty: 'advanced',
			estimatedTime: 25,
			icon: Database,
			steps: [
				'Check backward compatibility',
				'Review index changes',
				'Validate data migrations',
				'Check for locking issues',
				'Review rollback strategy',
				'Verify production impact'
			],
			tags: ['database', 'migrations', 'schema']
		}
	]);

	// Interactive Codebase Map Data
	const codebaseMap = $state({
		areas: [
			{
				id: 'frontend',
				name: 'Frontend',
				icon: Layout,
				color: 'blue',
				files: 245,
				reviews: 89,
				lastReviewed: '2 hours ago',
				children: [
					{ name: 'Components', path: 'src/components', reviews: 45, important: true },
					{ name: 'Pages', path: 'src/routes', reviews: 28, important: true },
					{ name: 'Hooks', path: 'src/hooks', reviews: 12, important: false },
					{ name: 'Stores', path: 'src/stores', reviews: 4, important: true }
				]
			},
			{
				id: 'backend',
				name: 'Backend API',
				icon: Server,
				color: 'emerald',
				files: 156,
				reviews: 67,
				lastReviewed: '4 hours ago',
				children: [
					{ name: 'Routes', path: 'src/api/routes', reviews: 34, important: true },
					{ name: 'Controllers', path: 'src/api/controllers', reviews: 18, important: true },
					{ name: 'Middleware', path: 'src/api/middleware', reviews: 15, important: true }
				]
			},
			{
				id: 'auth',
				name: 'Authentication',
				icon: Lock,
				color: 'purple',
				files: 42,
				reviews: 56,
				lastReviewed: '1 day ago',
				children: [
					{ name: 'Session', path: 'src/auth/session', reviews: 28, important: true },
					{ name: 'OAuth', path: 'src/auth/oauth', reviews: 18, important: true },
					{ name: 'Permissions', path: 'src/auth/permissions', reviews: 10, important: false }
				]
			},
			{
				id: 'database',
				name: 'Database',
				icon: Database,
				color: 'amber',
				files: 78,
				reviews: 34,
				lastReviewed: '3 days ago',
				children: [
					{ name: 'Schema', path: 'src/db/schema', reviews: 18, important: true },
					{ name: 'Migrations', path: 'src/db/migrations', reviews: 12, important: true },
					{ name: 'Queries', path: 'src/db/queries', reviews: 4, important: false }
				]
			}
		],
		recentVideos: [
			{ title: 'Auth Flow Walkthrough', area: 'auth', views: 24, duration: '8:32' },
			{ title: 'Dashboard Components', area: 'frontend', views: 18, duration: '12:15' },
			{ title: 'API Best Practices', area: 'backend', views: 31, duration: '15:48' },
			{ title: 'Database Schema Overview', area: 'database', views: 12, duration: '6:24' }
		]
	});

	// Calculate overall progress
	const totalLessons = $derived(
		onboardingModules.reduce((sum, m) => sum + m.totalLessons, 0)
	);
	const completedLessons = $derived(
		onboardingModules.reduce((sum, m) => sum + m.completedLessons, 0)
	);
	const overallProgress = $derived(
		Math.round((completedLessons / totalLessons) * 100)
	);

	// Filter templates based on search
	const filteredTemplates = $derived(
		searchQuery
			? reviewTemplates.filter(t =>
				t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
			)
			: reviewTemplates
	);

	onMount(() => {
		setTimeout(() => {
			loading = false;
		}, 600);
	});

	function getColorClasses(color: string) {
		const colors: Record<string, { bg: string; text: string; border: string }> = {
			blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
			purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
			emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
			amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
			rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' }
		};
		return colors[color] || colors.blue;
	}

	function getDifficultyColor(difficulty: string) {
		switch (difficulty) {
			case 'beginner': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
			case 'intermediate': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
			case 'advanced': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
			default: return '';
		}
	}

	function markLessonComplete(moduleId: string, lessonId: string) {
		const module = onboardingModules.find(m => m.id === moduleId);
		if (module) {
			const lesson = module.lessons.find(l => l.id === lessonId);
			if (lesson && !lesson.completed) {
				lesson.completed = true;
				module.completedLessons++;
			}
		}
	}

	function startTemplate(templateId: string) {
		goto(`/reviews/new?template=${templateId}`);
	}
</script>

<svelte:head>
	<title>Onboarding | CodeReview.live</title>
</svelte:head>

<div class="space-y-6 pb-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">
				Developer Onboarding
			</h1>
			<p class="text-muted-foreground mt-1">
				Master code reviews and explore your codebase through video walkthroughs
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Badge variant="outline" class="px-3 py-1.5 bg-primary/5">
				<GraduationCap class="h-4 w-4 mr-1" />
				{overallProgress}% Complete
			</Badge>
		</div>
	</div>

	<!-- Progress Overview Card -->
	<Card class="bg-gradient-to-r from-primary/5 via-background to-purple-500/5 border-primary/10">
		<CardContent class="py-6">
			<div class="flex flex-col lg:flex-row items-start lg:items-center gap-6">
				<div class="flex-1 space-y-3 w-full">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold">Your Learning Progress</h3>
						<span class="text-sm text-muted-foreground">
							{completedLessons} of {totalLessons} lessons completed
						</span>
					</div>
					<Progress value={overallProgress} class="h-3" />
					<div class="flex flex-wrap gap-2">
						{#each onboardingModules as module}
							{@const colors = getColorClasses(module.color)}
							<Badge variant="outline" class="{colors.bg} {colors.text} {colors.border}">
								{module.completedLessons}/{module.totalLessons} {module.title}
							</Badge>
						{/each}
					</div>
				</div>
				<div class="flex gap-3">
					<Button variant="outline" class="gap-2" onclick={() => activeTab = 'templates'}>
						<BookOpen class="h-4 w-4" />
						Templates
					</Button>
					<Button class="gap-2" onclick={() => {
						const nextModule = onboardingModules.find(m => m.completedLessons < m.totalLessons);
						if (nextModule) selectedModule = nextModule.id;
					}}>
						<Play class="h-4 w-4" />
						Continue Learning
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Main Tabs -->
	<Tabs bind:value={activeTab} class="space-y-6">
		<TabsList class="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
			<TabsTrigger value="progress" class="gap-2">
				<Target class="h-4 w-4" />
				<span class="hidden sm:inline">Learning Path</span>
			</TabsTrigger>
			<TabsTrigger value="templates" class="gap-2">
				<BookOpen class="h-4 w-4" />
				<span class="hidden sm:inline">Review Templates</span>
			</TabsTrigger>
			<TabsTrigger value="codemap" class="gap-2">
				<MapPin class="h-4 w-4" />
				<span class="hidden sm:inline">Codebase Map</span>
			</TabsTrigger>
		</TabsList>

		<!-- Learning Path Tab -->
		<TabsContent value="progress" class="space-y-6">
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each onboardingModules as module}
					{@const colors = getColorClasses(module.color)}
					{@const progress = Math.round((module.completedLessons / module.totalLessons) * 100)}
					{@const isComplete = module.completedLessons === module.totalLessons}

					<Card
						class="relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 {selectedModule === module.id ? 'ring-2 ring-primary' : ''}"
						onclick={() => selectedModule = selectedModule === module.id ? null : module.id}
					>
						<div class="absolute top-0 left-0 right-0 h-1 bg-muted">
							<div class="h-full {colors.bg.replace('/10', '')} transition-all" style="width: {progress}%"></div>
						</div>
						<CardHeader class="pb-2">
							<div class="flex items-start justify-between">
								<div class="{colors.bg} p-3 rounded-xl">
									<svelte:component this={module.icon} class="h-6 w-6 {colors.text}" />
								</div>
								{#if isComplete}
									<Badge variant="outline" class="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
										<CheckCircle2 class="h-3 w-3 mr-1" />
										Complete
									</Badge>
								{:else}
									<Badge variant="outline">
										{module.completedLessons}/{module.totalLessons}
									</Badge>
								{/if}
							</div>
							<CardTitle class="text-lg mt-3">{module.title}</CardTitle>
							<CardDescription>{module.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<div class="flex items-center justify-between text-sm text-muted-foreground">
								<div class="flex items-center gap-1">
									<Clock class="h-4 w-4" />
									{module.estimatedTime} min
								</div>
								<ChevronRight class="h-4 w-4 transition-transform {selectedModule === module.id ? 'rotate-90' : ''}" />
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>

			<!-- Expanded Module Content -->
			{#if selectedModule}
				{@const module = onboardingModules.find(m => m.id === selectedModule)}
				{#if module}
					{@const colors = getColorClasses(module.color)}
					<Card class="animate-in slide-in-from-top-2">
						<CardHeader>
							<div class="flex items-center gap-3">
								<div class="{colors.bg} p-3 rounded-xl">
									<svelte:component this={module.icon} class="h-6 w-6 {colors.text}" />
								</div>
								<div>
									<CardTitle>{module.title}</CardTitle>
									<CardDescription>{module.description}</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div class="space-y-2">
								{#each module.lessons as lesson, i}
									<div
										class="flex items-center gap-4 p-4 rounded-xl border transition-all hover:bg-muted/50 {lesson.completed ? 'bg-emerald-500/5 border-emerald-500/20' : ''}"
									>
										<div class="flex items-center justify-center h-8 w-8 rounded-full {lesson.completed ? 'bg-emerald-500' : 'bg-muted'} text-sm font-bold {lesson.completed ? 'text-white' : ''}">
											{#if lesson.completed}
												<CheckCircle2 class="h-5 w-5" />
											{:else}
												{i + 1}
											{/if}
										</div>
										<div class="flex-1">
											<div class="font-medium">{lesson.title}</div>
											<div class="text-sm text-muted-foreground flex items-center gap-2">
												<Clock class="h-3 w-3" />
												{lesson.duration} min
											</div>
										</div>
										{#if !lesson.completed}
											<Button size="sm" onclick={() => markLessonComplete(module.id, lesson.id)}>
												<Play class="h-4 w-4 mr-1" />
												Start
											</Button>
										{:else}
											<Badge variant="outline" class="bg-emerald-500/10 text-emerald-600">
												Completed
											</Badge>
										{/if}
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}
			{/if}
		</TabsContent>

		<!-- Review Templates Tab -->
		<TabsContent value="templates" class="space-y-6">
			<!-- Search & Filter -->
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="relative flex-1">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search templates..."
						bind:value={searchQuery}
						class="pl-9"
					/>
				</div>
				<div class="flex gap-2">
					<Badge variant="outline" class="px-3 py-2 cursor-pointer hover:bg-muted">All</Badge>
					<Badge variant="outline" class="px-3 py-2 cursor-pointer hover:bg-muted bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Beginner</Badge>
					<Badge variant="outline" class="px-3 py-2 cursor-pointer hover:bg-muted">Intermediate</Badge>
					<Badge variant="outline" class="px-3 py-2 cursor-pointer hover:bg-muted">Advanced</Badge>
				</div>
			</div>

			<!-- Templates Grid -->
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredTemplates as template}
					<Card class="group hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden">
						<CardHeader>
							<div class="flex items-start justify-between">
								<div class="p-3 rounded-xl bg-primary/10">
									<svelte:component this={template.icon} class="h-6 w-6 text-primary" />
								</div>
								<Badge variant="outline" class={getDifficultyColor(template.difficulty)}>
									{template.difficulty}
								</Badge>
							</div>
							<CardTitle class="text-lg mt-3 group-hover:text-primary transition-colors">
								{template.title}
							</CardTitle>
							<CardDescription>{template.description}</CardDescription>
						</CardHeader>
						<CardContent class="space-y-4">
							<!-- Steps Preview -->
							<div class="space-y-2">
								{#each template.steps.slice(0, 3) as step, i}
									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<div class="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
											{i + 1}
										</div>
										<span class="truncate">{step}</span>
									</div>
								{/each}
								{#if template.steps.length > 3}
									<div class="text-sm text-muted-foreground pl-7">
										+{template.steps.length - 3} more steps
									</div>
								{/if}
							</div>

							<!-- Tags -->
							<div class="flex flex-wrap gap-1">
								{#each template.tags as tag}
									<Badge variant="secondary" class="text-xs">{tag}</Badge>
								{/each}
							</div>

							<!-- Footer -->
							<div class="flex items-center justify-between pt-2 border-t">
								<div class="flex items-center gap-1 text-sm text-muted-foreground">
									<Clock class="h-4 w-4" />
									{template.estimatedTime} min
								</div>
								<Button size="sm" onclick={() => startTemplate(template.id)}>
									Use Template
									<ArrowRight class="h-4 w-4 ml-1" />
								</Button>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>

			{#if filteredTemplates.length === 0}
				<div class="text-center py-12">
					<BookOpen class="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
					<h3 class="font-semibold mb-2">No templates found</h3>
					<p class="text-muted-foreground">Try a different search term</p>
				</div>
			{/if}
		</TabsContent>

		<!-- Codebase Map Tab -->
		<TabsContent value="codemap" class="space-y-6">
			<div class="grid gap-6 lg:grid-cols-3">
				<!-- Main Map -->
				<div class="lg:col-span-2 space-y-4">
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<FolderTree class="h-5 w-5 text-primary" />
								Interactive Codebase Map
							</CardTitle>
							<CardDescription>
								Explore which areas have been reviewed with video walkthroughs
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-4">
							{#each codebaseMap.areas as area}
								{@const colors = getColorClasses(area.color)}
								<Accordion type="single" collapsible>
									<AccordionItem value={area.id} class="border rounded-xl px-4">
										<AccordionTrigger class="hover:no-underline py-4">
											<div class="flex items-center gap-4 w-full">
												<div class="{colors.bg} p-2.5 rounded-lg">
													<svelte:component this={area.icon} class="h-5 w-5 {colors.text}" />
												</div>
												<div class="flex-1 text-left">
													<div class="font-semibold">{area.name}</div>
													<div class="text-sm text-muted-foreground">
														{area.files} files • {area.reviews} reviews
													</div>
												</div>
												<Badge variant="outline" class="mr-4">
													Last reviewed {area.lastReviewed}
												</Badge>
											</div>
										</AccordionTrigger>
										<AccordionContent>
											<div class="space-y-2 pb-4">
												{#each area.children as child}
													<div class="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
														<FileCode class="h-4 w-4 text-muted-foreground" />
														<div class="flex-1">
															<div class="font-medium text-sm">{child.name}</div>
															<div class="text-xs text-muted-foreground font-mono">{child.path}</div>
														</div>
														<div class="flex items-center gap-2">
															{#if child.important}
																<Badge variant="outline" class="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
																	<Star class="h-3 w-3 mr-1" />
																	Key Area
																</Badge>
															{/if}
															<Badge variant="secondary" class="text-xs">
																{child.reviews} reviews
															</Badge>
														</div>
													</div>
												{/each}
											</div>
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							{/each}
						</CardContent>
					</Card>
				</div>

				<!-- Recent Video Walkthroughs -->
				<div class="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<FileVideo class="h-5 w-5 text-primary" />
								Recent Walkthroughs
							</CardTitle>
							<CardDescription>
								Video reviews explaining key areas
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-3">
							{#each codebaseMap.recentVideos as video}
								<div class="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
									<div class="relative">
										<div class="h-12 w-16 rounded-lg bg-muted flex items-center justify-center">
											<Play class="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
										</div>
										<Badge class="absolute -bottom-1 -right-1 text-xs px-1">
											{video.duration}
										</Badge>
									</div>
									<div class="flex-1 min-w-0">
										<div class="font-medium text-sm truncate">{video.title}</div>
										<div class="text-xs text-muted-foreground flex items-center gap-2">
											<Eye class="h-3 w-3" />
											{video.views} views
										</div>
									</div>
								</div>
							{/each}
						</CardContent>
					</Card>

					<!-- Quick Tips -->
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<Lightbulb class="h-5 w-5 text-amber-500" />
								Onboarding Tips
							</CardTitle>
						</CardHeader>
						<CardContent class="space-y-3">
							<div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
								<div class="font-medium text-sm text-amber-700 dark:text-amber-400">
									Start with Key Areas
								</div>
								<div class="text-xs text-muted-foreground mt-1">
									Focus on files marked with ⭐ first - they're critical to understand the codebase.
								</div>
							</div>
							<div class="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
								<div class="font-medium text-sm text-blue-700 dark:text-blue-400">
									Watch Before You Code
								</div>
								<div class="text-xs text-muted-foreground mt-1">
									Review video walkthroughs before making changes to unfamiliar areas.
								</div>
							</div>
							<div class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
								<div class="font-medium text-sm text-emerald-700 dark:text-emerald-400">
									Ask Questions
								</div>
								<div class="text-xs text-muted-foreground mt-1">
									Use video comments to ask clarifying questions - it helps future team members too!
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</TabsContent>
	</Tabs>
</div>
