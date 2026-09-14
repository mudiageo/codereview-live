<script lang="ts">
	import { page } from '$app/state';
	import { SsgoiTransition } from '@ssgoi/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Badge } from '$lib/components/ui/badge';
	import Video from '@lucide/svelte/icons/video';
	import User from '@lucide/svelte/icons/user';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Settings from '@lucide/svelte/icons/settings';
	import Home from '@lucide/svelte/icons/home';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import { auth } from '$lib/stores/auth.svelte';
	import { cn } from '$lib/utils';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();

	const user = $derived(
		auth.currentUser || {
			name: 'Developer',
			email: '',
			image: ''
		}
	);

	function getInitials(name: string) {
		if (!name) return 'U';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}


	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<Toaster richColors position="top-right" />

<div class="flex flex-col min-h-screen bg-background">
	<!-- Header -->
	<header
		class="sticky top-0 z-50 flex h-14 md:h-16 items-center gap-4 border-b bg-background/95 backdrop-blur-lg px-4 md:px-6 shadow-sm"
	>
		<!-- Logo -->
		<a href="/dashboard" class="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0"
			>
				<Video class="h-4 w-4" />
			</div>
			<span class="text-base font-semibold hidden sm:inline">CodeReview.live</span>
		</a>

		<!-- Breadcrumb / page label -->
		<div class="flex items-center gap-2 text-sm text-muted-foreground">
			<span class="hidden sm:inline">/</span>
			<Badge variant="secondary" class="gap-1.5 font-medium">
				<GraduationCap class="h-3.5 w-3.5" />
				Onboarding
			</Badge>
		</div>

		<!-- Right actions -->
		<div class="flex items-center gap-2 ml-auto">
			<Button variant="outline" size="sm" href="/dashboard" class="hidden sm:flex gap-2">
				<Home class="h-4 w-4" />
				Go to Dashboard
			</Button>

			<!-- User Menu -->
			<DropdownMenu>
				<DropdownMenuTrigger>
					{#snippet child({ props })}
						<Button {...props} variant="ghost" size="icon" class="rounded-full">
							<Avatar class="h-8 w-8">
								<AvatarImage src={user.image || ''} alt={user.name} />
								<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
							</Avatar>
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" class="w-56">
					<DropdownMenuLabel>
						<div class="flex flex-col space-y-1">
							<p class="text-sm font-medium">{user.name}</p>
							{#if user.email}
								<p class="text-xs text-muted-foreground">{user.email}</p>
							{/if}
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem href="/settings">
						<User class="mr-2 h-4 w-4" />
						Profile
					</DropdownMenuItem>
					<DropdownMenuItem href="/settings/billing">
						<CreditCard class="mr-2 h-4 w-4" />
						Billing
					</DropdownMenuItem>
					<DropdownMenuItem href="/settings">
						<Settings class="mr-2 h-4 w-4" />
						Settings
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onclick={auth.logOut}>
						<LogOut class="mr-2 h-4 w-4" />
						Log out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
		<SsgoiTransition id={page.url.pathname}>
			{@render children()}
		</SsgoiTransition>
	</main>

	<!-- Mobile bottom nav -->
	<nav
		class="fixed bottom-0 left-0 right-0 z-40 h-14 border-t bg-background/95 backdrop-blur-lg md:hidden"
	>
		<div class="flex items-center justify-around px-2 h-full">
			<a
				href="/onboarding"
				class={cn(
					'flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-200',
					isActive('/onboarding') ? 'text-primary' : 'text-muted-foreground'
				)}
			>
				<GraduationCap class="h-5 w-5" />
				<span class="text-xs">Onboarding</span>
			</a>
			<a
				href="/dashboard"
				class={cn(
					'flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-200',
					isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
				)}
			>
				<Home class="h-5 w-5" />
				<span class="text-xs">Dashboard</span>
			</a>
			<a
				href="/settings"
				class={cn(
					'flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-200',
					isActive('/settings') ? 'text-primary' : 'text-muted-foreground'
				)}
			>
				<Settings class="h-5 w-5" />
				<span class="text-xs">Settings</span>
			</a>
		</div>
	</nav>
</div>
