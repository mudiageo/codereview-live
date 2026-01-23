<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Video from '@lucide/svelte/icons/video';
	import Zap from '@lucide/svelte/icons/zap';
	import Users from '@lucide/svelte/icons/users';
	import Bot from '@lucide/svelte/icons/bot';
	import Github from '@lucide/svelte/icons/github';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import Share2 from '@lucide/svelte/icons/share-2';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import Code from '@lucide/svelte/icons/code';
    import Play from '@lucide/svelte/icons/play';
    import Mic from '@lucide/svelte/icons/mic';

    import { onMount } from 'svelte';

    let visible = $state(false);

    onMount(() => {
        visible = true;
    });
</script>

<div class="flex flex-col items-center">
    <!-- Hero Section -->
    <section class="w-full pt-32 pb-20 px-4 flex flex-col items-center text-center relative overflow-hidden">
        <!-- Background Elements -->
        <div class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-50"></div>
        <div class="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>

        <div class="max-w-4xl space-y-6 animate-fade-in-up">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4 animate-bounce-subtle">
                <span class="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
                CodeSpring Hackathon Submission
            </div>

            <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-blue-500 pb-2">
                Code Reviews, <br class="hidden md:block" /> Reimagined.
            </h1>

            <p class="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Stop writing essays in PR comments. Use <strong>async video</strong>, <strong>AI insights</strong>, and <strong>interactive collaboration</strong> to ship better code, faster.
            </p>

            <div class="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Button size="lg" href="/register" class="h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1">
                    Get Started Free
                </Button>
                <Button variant="outline" size="lg" href="#demo" class="h-12 px-8 text-lg rounded-full hover:bg-muted/50 transition-all">
                    <Play class="mr-2 h-4 w-4" /> Watch Demo
                </Button>
            </div>
        </div>

        <!-- Hero Visual: Mock Interface -->
        <div class="mt-16 w-full max-w-5xl perspective-1000">
            <div class="relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl transform rotate-x-6 hover:rotate-x-0 transition-transform duration-700 p-2 md:p-4">
                <!-- Mock Window Header -->
                <div class="flex items-center gap-2 px-4 py-2 border-b border-border/50 mb-2">
                    <div class="flex gap-1.5">
                        <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div class="flex-1 text-center text-xs text-muted-foreground font-mono">src/lib/components/Hero.svelte</div>
                </div>

                <!-- Mock Code & Video Bubble -->
                <div class="relative grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 h-[400px] overflow-hidden bg-code-bg/50 rounded-lg p-4 text-left font-mono text-sm">
                    <!-- Code -->
                    <div class="space-y-1 opacity-80">
                        <div class="flex gap-4"><span class="text-muted-foreground select-none">1</span> <span class="text-code-keyword">export</span> <span class="text-code-keyword">function</span> <span class="text-code-function">calculateMetrics</span>(data) {'{'}</div>
                        <div class="flex gap-4"><span class="text-muted-foreground select-none">2</span> &nbsp;&nbsp;<span class="text-code-keyword">const</span> result = data.<span class="text-code-function">reduce</span>((acc, curr) => {'{'}</div>
                        <div class="flex gap-4"><span class="text-muted-foreground select-none">3</span> &nbsp;&nbsp;&nbsp;&nbsp;<span class="text-code-keyword">return</span> acc + curr.value;</div>
                        <div class="flex gap-4 bg-red-500/10 border-l-2 border-red-500 -mx-4 px-4"><span class="text-muted-foreground select-none">4</span> &nbsp;&nbsp;{'}'}, 0); <span class="text-muted-foreground">// Potential overflow here?</span></div>
                        <div class="flex gap-4"><span class="text-muted-foreground select-none">5</span> &nbsp;&nbsp;<span class="text-code-keyword">return</span> result;</div>
                        <div class="flex gap-4"><span class="text-muted-foreground select-none">6</span> {'}'}</div>
                    </div>

                    <!-- AI Panel Mock -->
                    <div class="hidden md:flex flex-col gap-3 border-l border-border/50 pl-4">
                        <div class="flex items-center gap-2 text-primary font-semibold">
                            <Bot class="h-4 w-4" /> AI Analysis
                        </div>
                        <div class="p-3 rounded-lg bg-primary/5 text-xs space-y-2 border border-primary/10">
                            <p class="font-medium text-foreground">Optimization Tip:</p>
                            <p class="text-muted-foreground">Consider using a more robust type for large number accumulations to avoid overflow.</p>
                        </div>
                         <div class="p-3 rounded-lg bg-green-500/5 text-xs space-y-2 border border-green-500/10">
                            <p class="font-medium text-foreground">Security Check:</p>
                            <p class="text-muted-foreground">No obvious vulnerabilities found.</p>
                        </div>
                    </div>

                    <!-- Floating Video Bubble -->
                    <div class="absolute bottom-8 right-8 md:right-[320px] w-48 h-32 bg-gray-900 rounded-xl shadow-2xl border-2 border-primary overflow-hidden animate-float">
                        <div class="absolute inset-0 flex items-center justify-center bg-gray-800">
                             <!-- Mock User Avatar/Video -->
                             <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">JD</div>
                        </div>
                        <div class="absolute bottom-2 left-2 flex gap-1">
                            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span class="text-[10px] text-white font-medium">Recording...</span>
                        </div>
                    </div>

                    <!-- Cursor Mock -->
                     <div class="absolute top-[88px] left-[200px] flex flex-col items-start animate-cursor-move">
                        <svg class="w-5 h-5 text-yellow-500 fill-current drop-shadow-md" viewBox="0 0 24 24"><path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19138L11.7841 12.3673H5.65376Z"/></svg>
                        <span class="px-2 py-0.5 rounded-full bg-yellow-500 text-[10px] text-white font-bold ml-2">Jane</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Bento Grid Features -->
    <section class="container mx-auto px-4 py-20">
        <h2 class="text-3xl md:text-5xl font-bold text-center mb-16">Everything you need to ship faster</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Large Card 1 -->
            <div class="md:col-span-2 group relative overflow-hidden rounded-3xl border bg-card p-8 hover:shadow-2xl transition-all duration-300">
                <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="relative z-10">
                    <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                        <Video class="h-6 w-6" />
                    </div>
                    <h3 class="text-2xl font-bold mb-2">Async Video Reviews</h3>
                    <p class="text-muted-foreground mb-6 max-w-md">Record your screen, camera, and voice to explain complex logic. Context is king, and text often fails to capture the "why".</p>
                    <!-- Visual -->
                    <div class="rounded-xl bg-muted/50 h-48 border border-border/50 flex items-center justify-center overflow-hidden relative">
                         <div class="absolute inset-0 flex items-center justify-center">
                            <div class="w-16 h-16 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play class="h-6 w-6 text-primary ml-1" />
                            </div>
                         </div>
                         <div class="absolute bottom-4 left-4 right-4 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                             <div class="h-full w-1/3 bg-primary"></div>
                         </div>
                    </div>
                </div>
            </div>

            <!-- Card 2 -->
             <div class="group relative overflow-hidden rounded-3xl border bg-card p-8 hover:shadow-2xl transition-all duration-300">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div class="relative z-10">
                    <div class="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500">
                        <Bot class="h-6 w-6" />
                    </div>
                    <h3 class="text-2xl font-bold mb-2">AI Explain & Analyze</h3>
                    <p class="text-muted-foreground mb-4">Let AI summarize diffs, catch bugs, and suggest optimizations before you even look.</p>
                </div>
            </div>

            <!-- Card 3 -->
             <div class="group relative overflow-hidden rounded-3xl border bg-card p-8 hover:shadow-2xl transition-all duration-300">
                <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div class="relative z-10">
                    <div class="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 text-green-500">
                        <Zap class="h-6 w-6" />
                    </div>
                    <h3 class="text-2xl font-bold mb-2">P2P Sharing</h3>
                    <p class="text-muted-foreground mb-4">Transfer large video files directly to teammates without waiting for cloud uploads. Fast & Secure.</p>
                </div>
            </div>

             <!-- Large Card 4 -->
            <div class="md:col-span-2 group relative overflow-hidden rounded-3xl border bg-card p-8 hover:shadow-2xl transition-all duration-300">
                <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="relative z-10">
                    <div class="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-500">
                        <Users class="h-6 w-6" />
                    </div>
                    <h3 class="text-2xl font-bold mb-2">Teams & Presence</h3>
                    <p class="text-muted-foreground mb-6 max-w-md">See who is reviewing what in real-time. Follow their cursor, jump to their focus, and chat contextually.</p>
                     <div class="flex items-center -space-x-4">
                        {#each [1, 2, 3, 4] as i}
                            <div class="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold relative group-hover:translate-x-1 transition-transform" style="background-color: hsl({i * 60}, 70%, 80%)">
                                U{i}
                            </div>
                        {/each}
                        <div class="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold">+5</div>
                     </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Interactive Features Strip -->
    <section class="w-full bg-muted/30 py-20 border-y border-border/50">
        <div class="container mx-auto px-4">
             <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                 <div class="flex flex-col items-center text-center gap-4 p-4 hover:-translate-y-1 transition-transform">
                     <div class="w-16 h-16 rounded-full bg-background border shadow-sm flex items-center justify-center text-foreground">
                         <Github class="h-8 w-8" />
                     </div>
                     <h4 class="font-semibold">GitHub Integration</h4>
                     <p class="text-sm text-muted-foreground">Import PRs directly. Sync comments back to GitHub.</p>
                 </div>
                 <div class="flex flex-col items-center text-center gap-4 p-4 hover:-translate-y-1 transition-transform">
                     <div class="w-16 h-16 rounded-full bg-background border shadow-sm flex items-center justify-center text-foreground">
                         <MessageSquare class="h-8 w-8" />
                     </div>
                     <h4 class="font-semibold">Smart Chapters</h4>
                     <p class="text-sm text-muted-foreground">Videos are auto-indexed by file and function visited.</p>
                 </div>
                 <div class="flex flex-col items-center text-center gap-4 p-4 hover:-translate-y-1 transition-transform">
                     <div class="w-16 h-16 rounded-full bg-background border shadow-sm flex items-center justify-center text-foreground">
                         <CheckCircle class="h-8 w-8" />
                     </div>
                     <h4 class="font-semibold">Review Checklists</h4>
                     <p class="text-sm text-muted-foreground">Standardize reviews with customizable team checklists.</p>
                 </div>
                 <div class="flex flex-col items-center text-center gap-4 p-4 hover:-translate-y-1 transition-transform">
                     <div class="w-16 h-16 rounded-full bg-background border shadow-sm flex items-center justify-center text-foreground">
                         <Code class="h-8 w-8" />
                     </div>
                     <h4 class="font-semibold">Modern Workspace</h4>
                     <p class="text-sm text-muted-foreground">Monaco-based editor with rich diff viewing capabilities.</p>
                 </div>
             </div>
        </div>
    </section>

    <!-- Testimonial (Mock) -->
    <section class="container mx-auto px-4 py-24 text-center">
        <div class="max-w-3xl mx-auto space-y-8">
            <h2 class="text-3xl font-bold">Developers love it</h2>
             <blockquote class="text-xl md:text-2xl font-medium leading-relaxed">
                "CodeReview.live has completely transformed our PR process. The video context eliminates misunderstandings, and the AI summaries save us hours every week."
            </blockquote>
            <div class="flex items-center justify-center gap-4">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500"></div>
                <div class="text-left">
                    <div class="font-bold">Alex Chen</div>
                    <div class="text-sm text-muted-foreground">Senior Engineer @ TechCorp</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Bottom CTA -->
    <section class="w-full py-20 bg-primary/5 border-t border-primary/10">
        <div class="container mx-auto px-4 text-center space-y-8">
            <h2 class="text-4xl font-bold tracking-tight">Ready to upgrade your workflow?</h2>
            <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of developers shipping better code with async video reviews.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" href="/register" class="h-14 px-8 text-lg rounded-full">Start for Free</Button>
                <Button variant="outline" size="lg" href="/contact" class="h-14 px-8 text-lg rounded-full bg-background">Contact Sales</Button>
            </div>
            <p class="text-sm text-muted-foreground">No credit card required for free tier.</p>
        </div>
    </section>
</div>

<style>
    /* Custom simple animations for the hero visual */
    .perspective-1000 {
        perspective: 1000px;
    }

    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }

    .animate-float {
        animation: float 6s ease-in-out infinite;
    }

    @keyframes cursor-move {
        0% { transform: translate(0, 0); opacity: 0; }
        10% { opacity: 1; }
        25% { transform: translate(100px, 50px); }
        50% { transform: translate(100px, 50px); }
        75% { transform: translate(50px, 150px); }
        100% { transform: translate(0, 0); opacity: 0; }
    }

    .animate-cursor-move {
        animation: cursor-move 8s ease-in-out infinite;
    }

    .animate-bounce-subtle {
        animation: bounce 2s infinite;
    }

    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
    }
</style>
