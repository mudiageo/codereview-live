<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import Video from '@lucide/svelte/icons/video';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';
	import Github from '@lucide/svelte/icons/github';
	import Twitter from '@lucide/svelte/icons/twitter';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';
	import '../layout.css';

	let { children } = $props();

	let isScrolled = $state(false);
	let mobileMenuOpen = $state(false);

	function handleScroll() {
		isScrolled = window.scrollY > 20;
	}

	onMount(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	const navItems = [
		{ name: 'Features', href: '/features' },
		{ name: 'Pricing', href: '/pricing' },
		{ name: 'About', href: '/about' }
	];

    function isActive(href: string) {
        return page.url.pathname === href;
    }
</script>

<div class="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 overflow-x-hidden">
	<!-- Navbar -->
	<header
		class={cn(
			'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent',
			isScrolled ? 'bg-background/80 backdrop-blur-md border-border shadow-sm' : 'bg-transparent'
		)}
	>
		<div class="container mx-auto px-4 h-16 flex items-center justify-between">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2 group">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-110"
				>
					<Video class="h-5 w-5" />
				</div>
				<span class="text-xl font-bold tracking-tight">CodeReview.live</span>
			</a>

			<!-- Desktop Nav -->
			<nav class="hidden md:flex items-center gap-8">
				{#each navItems as item}
					<a
						href={item.href}
						class={cn(
							'text-sm font-medium transition-colors hover:text-primary',
							isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
						)}
					>
						{item.name}
					</a>
				{/each}
			</nav>

			<!-- CTA Buttons -->
			<div class="hidden md:flex items-center gap-4">
				<Button variant="ghost" href="/login">Log in</Button>
				<Button href="/signup">Get Started</Button>
			</div>

			<!-- Mobile Menu Toggle -->
			<button
				class="md:hidden p-2 text-muted-foreground hover:text-foreground"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
                aria-label="Toggle menu"
			>
				{#if mobileMenuOpen}
					<X class="h-6 w-6" />
				{:else}
					<Menu class="h-6 w-6" />
				{/if}
			</button>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden absolute top-16 left-0 right-0 bg-background border-b shadow-lg p-4 flex flex-col gap-4 animate-in slide-in-from-top-5">
				{#each navItems as item}
					<a
						href={item.href}
						class={cn(
							'text-base font-medium p-2 rounded-md transition-colors hover:bg-muted',
                            isActive(item.href) ? 'text-primary bg-primary/10' : 'text-muted-foreground'
						)}
						onclick={() => (mobileMenuOpen = false)}
					>
						{item.name}
					</a>
				{/each}
				<div class="h-px bg-border my-2"></div>
				<Button variant="ghost" href="/login" class="w-full justify-start">Log in</Button>
				<Button href="/signup" class="w-full">Get Started</Button>
			</div>
		{/if}
	</header>

	<!-- Main Content -->
	<main class="flex-1 pt-16">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="bg-muted/30 border-t mt-20">
		<div class="container mx-auto px-4 py-12">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
				<div class="space-y-4">
					<div class="flex items-center gap-2">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
						>
							<Video class="h-5 w-5" />
						</div>
						<span class="text-xl font-bold">CodeReview.live</span>
					</div>
					<p class="text-sm text-muted-foreground max-w-xs">
						Revolutionizing code reviews with async video, AI insights, and real-time collaboration.
					</p>
                    <div class="flex gap-4 pt-2">
                         <a href="https://github.com/mudiageo/codereview-live" target="_blank" rel="noreferrer" class="text-muted-foreground hover:text-primary transition-colors">
                             <Github class="h-5 w-5" />
                             <span class="sr-only">GitHub</span>
                         </a>
                         <a href="https://twitter.com" target="_blank" rel="noreferrer" class="text-muted-foreground hover:text-primary transition-colors">
                             <Twitter class="h-5 w-5" />
                             <span class="sr-only">Twitter</span>
                         </a>
                    </div>
				</div>

				<div>
					<h3 class="font-semibold mb-4">Product</h3>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li><a href="/features" class="hover:text-foreground transition-colors">Features</a></li>
						<li><a href="/pricing" class="hover:text-foreground transition-colors">Pricing</a></li>
						<li><a href="/about" class="hover:text-foreground transition-colors">About</a></li>
					</ul>
				</div>

				<div>
					<h3 class="font-semibold mb-4">Resources</h3>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li><a href="/docs" class="hover:text-foreground transition-colors">Documentation</a></li>
						<li><a href="/blog" class="hover:text-foreground transition-colors">Blog</a></li>
						<li><a href="/community" class="hover:text-foreground transition-colors">Community</a></li>
					</ul>
				</div>

				<div>
					<h3 class="font-semibold mb-4">Hackathon</h3>
					<div class="rounded-lg border bg-background p-4 shadow-sm">
						<p class="text-sm font-medium mb-2">CodeSpring Devpost</p>
						<p class="text-xs text-muted-foreground mb-3">
							Proudly built for the CodeSpring hackathon.
						</p>
						<a
							href="https://code-spring.devpost.com"
							target="_blank"
							rel="noreferrer"
							class="text-xs font-semibold text-primary hover:underline"
						>
							View Submission &rarr;
						</a>
					</div>
				</div>
			</div>

			<div class="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
				<p>&copy; {new Date().getFullYear()} CodeReview.live. All rights reserved.</p>
				<div class="flex gap-6">
					<a href="/privacy" class="hover:text-foreground transition-colors">Privacy Policy</a>
					<a href="/terms" class="hover:text-foreground transition-colors">Terms of Service</a>
				</div>
			</div>
		</div>
	</footer>
</div>
