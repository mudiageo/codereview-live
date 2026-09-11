<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import Video from '@lucide/svelte/icons/video';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import Bot from '@lucide/svelte/icons/bot';
	import Github from '@lucide/svelte/icons/github';
	import CheckSquare from '@lucide/svelte/icons/check-square';
	import Share2 from '@lucide/svelte/icons/share-2';
    import Keyboard from '@lucide/svelte/icons/keyboard';
    import Search from '@lucide/svelte/icons/search';

    const features = [
        {
            title: 'Async Video Reviews',
            description: 'Why write a novel when you can record a 2-minute video? Walk through your code, highlight tricky logic, and explain the "why" behind your changes.',
            icon: Video,
            color: 'text-pink-500',
            bgColor: 'bg-pink-500/10',
            bullets: ['Screen & Camera Recording', 'Voiceover Annotations', 'Playback Speed Control']
        },
        {
            title: 'Real-time Collaboration',
            description: 'Coding is better together. See who is viewing your PR, follow their cursor, and jump to their location instantly.',
            icon: MessageSquare,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            bullets: ['Live Presence Indicators', 'Cursor Tracking', 'Contextual Chat']
        },
         {
            title: 'AI-Powered Insights',
            description: 'Let our AI do the heavy lifting. It analyzes your diffs, suggests optimizations, and even catches potential bugs before you assign a reviewer.',
            icon: Bot,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            bullets: ['Auto-Summarization', 'Code Optimization Tips', 'Security Vulnerability Checks']
        },
         {
            title: 'Smart Workflows',
            description: 'Stay in the flow with tools designed for power users. Navigate files with keyboard shortcuts and manage reviews with checklists.',
            icon: CheckSquare,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            bullets: ['Review Checklists', 'Command Palette (Cmd+K)', 'Smart Chapters']
        }
    ];
</script>

<div class="pt-24 pb-20">
    <div class="container mx-auto px-4">
        <!-- Header -->
        <div class="text-center max-w-3xl mx-auto mb-20">
            <h1 class="text-4xl md:text-6xl font-bold tracking-tight mb-6">Features that <span class="text-primary">empower</span> developers</h1>
            <p class="text-xl text-muted-foreground">
                We've built the ultimate code review environment. Explore the tools that will make your team ship faster and happier.
            </p>
        </div>

        <!-- Feature Rows -->
        <div class="space-y-32">
            {#each features as feature, i}
                <div class="flex flex-col md:flex-row items-center gap-12 md:gap-20 {i % 2 === 1 ? 'md:flex-row-reverse' : ''}">
                    <!-- Text Side -->
                    <div class="flex-1 space-y-6">
                        <div class="inline-flex items-center justify-center p-3 rounded-2xl {feature.bgColor} {feature.color} mb-2">
                            <feature.icon class="h-8 w-8" />
                        </div>
                        <h2 class="text-3xl font-bold">{feature.title}</h2>
                        <p class="text-lg text-muted-foreground leading-relaxed">
                            {feature.description}
                        </p>
                        <ul class="space-y-3 pt-2">
                            {#each feature.bullets as bullet}
                                <li class="flex items-center gap-3">
                                    <div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
                                    <span class="font-medium">{bullet}</span>
                                </li>
                            {/each}
                        </ul>
                    </div>

                    <!-- Visual Side (Mock) -->
                    <div class="flex-1 w-full">
                        <div class="relative aspect-video rounded-2xl overflow-hidden border bg-card/50 shadow-2xl flex items-center justify-center group">
                            <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5"></div>

                            <!-- Abstract Representation -->
                            <div class="relative z-10 flex flex-col items-center gap-4 transition-transform duration-500 group-hover:scale-110">
                                <div class="p-6 rounded-full bg-background shadow-xl border">
                                    <feature.icon class="h-12 w-12 {feature.color}" />
                                </div>
                                <div class="px-4 py-2 rounded-lg bg-background/80 backdrop-blur border text-sm font-mono text-muted-foreground">
                                    {feature.title}_Demo.mp4
                                </div>
                            </div>

                            <!-- Decorative Elements -->
                            <div class="absolute -top-10 -right-10 w-32 h-32 {feature.bgColor} rounded-full blur-3xl opacity-50"></div>
                            <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-50"></div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Extra Grid for Smaller Features -->
        <div class="mt-32">
             <h2 class="text-3xl font-bold text-center mb-12">And so much more...</h2>
             <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                 <div class="p-6 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                     <Github class="h-8 w-8 mb-4" />
                     <h3 class="font-bold mb-2">GitHub Integration</h3>
                     <p class="text-sm text-muted-foreground">Seamlessly sync PRs, comments, and status checks.</p>
                 </div>
                 <div class="p-6 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                     <Share2 class="h-8 w-8 mb-4" />
                     <h3 class="font-bold mb-2">P2P Sharing</h3>
                     <p class="text-sm text-muted-foreground">Direct device-to-device video transfer for privacy and speed.</p>
                 </div>
                 <div class="p-6 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                     <Keyboard class="h-8 w-8 mb-4" />
                     <h3 class="font-bold mb-2">Keyboard First</h3>
                     <p class="text-sm text-muted-foreground">Navigate diffs and manage recordings without touching your mouse.</p>
                 </div>
                 <div class="p-6 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                     <Search class="h-8 w-8 mb-4" />
                     <h3 class="font-bold mb-2">Deep Search</h3>
                     <p class="text-sm text-muted-foreground">Find any comment, video, or line of code instantly.</p>
                 </div>
                 <div class="p-6 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                     <div class="h-8 w-8 mb-4 flex items-center justify-center font-bold text-lg bg-primary/10 rounded-lg text-primary">MD</div>
                     <h3 class="font-bold mb-2">Markdown Support</h3>
                     <p class="text-sm text-muted-foreground">Rich text editing for all your written comments.</p>
                 </div>
                  <div class="p-6 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                     <div class="h-8 w-8 mb-4 flex items-center justify-center font-bold text-lg bg-primary/10 rounded-lg text-primary">🔒</div>
                     <h3 class="font-bold mb-2">Enterprise Ready</h3>
                     <p class="text-sm text-muted-foreground">SSO, audit logs, and on-premise deployment options.</p>
                 </div>
             </div>
        </div>

        <!-- Bottom CTA -->
        <div class="mt-32 text-center">
            <h2 class="text-3xl font-bold mb-6">Seen enough?</h2>
            <Button size="lg" href="/register" class="h-12 px-8 rounded-full">Start Reviewing Now</Button>
        </div>
    </div>
</div>
