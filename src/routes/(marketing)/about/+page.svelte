<script lang="ts">
	import { Button } from '$lib/components/ui/button';
    import Video from '@lucide/svelte/icons/video';
    import Code from '@lucide/svelte/icons/code';
    import Server from '@lucide/svelte/icons/server';
    import Database from '@lucide/svelte/icons/database';
</script>

<div class="pt-24 pb-20">
    <div class="container mx-auto px-4 max-w-4xl">
        <!-- Header -->
        <div class="text-center mb-20">
            <h1 class="text-4xl md:text-6xl font-bold tracking-tight mb-6">Built for <span class="text-primary">Developers</span></h1>
            <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
                CodeReview.live was born out of frustration. Text-based PR reviews are slow, prone to misunderstanding, and lack human connection. We're changing that.
            </p>
        </div>

        <!-- Mission -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <div>
                 <h2 class="text-3xl font-bold mb-4">Our Mission</h2>
                 <p class="text-lg text-muted-foreground leading-relaxed mb-4">
                     We believe that code is a creative pursuit, but the tools we use to review it are stuck in the 90s.
                 </p>
                 <p class="text-lg text-muted-foreground leading-relaxed">
                     Our mission is to bring <strong>fidelity</strong> back to code reviews. By combining async video, AI, and real-time collaboration, we help teams share knowledge faster and build better software together.
                 </p>
            </div>
            <div class="bg-muted/30 rounded-3xl p-8 border border-border/50">
                <div class="space-y-6">
                    <div class="flex items-start gap-4">
                        <div class="p-2 bg-primary/10 rounded-lg text-primary mt-1">
                            <Video class="h-5 w-5" />
                        </div>
                        <div>
                            <h3 class="font-bold">High Fidelity</h3>
                            <p class="text-sm text-muted-foreground">Video captures tone and context that text misses.</p>
                        </div>
                    </div>
                     <div class="flex items-start gap-4">
                        <div class="p-2 bg-blue-500/10 rounded-lg text-blue-500 mt-1">
                            <Code class="h-5 w-5" />
                        </div>
                        <div>
                            <h3 class="font-bold">Developer First</h3>
                            <p class="text-sm text-muted-foreground">Built by devs, for devs. Keyboard centric and fast.</p>
                        </div>
                    </div>
                     <div class="flex items-start gap-4">
                        <div class="p-2 bg-purple-500/10 rounded-lg text-purple-500 mt-1">
                            <Database class="h-5 w-5" />
                        </div>
                        <div>
                            <h3 class="font-bold">Local First</h3>
                            <p class="text-sm text-muted-foreground">Your code stays on your machine until you choose to share.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hackathon Section -->
        <div class="bg-gradient-to-br from-primary/5 to-purple-500/5 border rounded-3xl p-10 text-center mb-20">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-6">
                CodeSpring Hackathon
            </div>
            <h2 class="text-3xl font-bold mb-4">A Hackathon Project</h2>
            <p class="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                This project was built for the CodeSpring Hackathon. It represents a bold vision for the future of developer tools, built with the latest web technologies.
            </p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm font-mono text-muted-foreground">
                <div class="p-4 bg-background rounded-xl border">SvelteKit 2</div>
                <div class="p-4 bg-background rounded-xl border">Tailwind v4</div>
                <div class="p-4 bg-background rounded-xl border">WebRTC</div>
                <div class="p-4 bg-background rounded-xl border">Tauri</div>
            </div>
        </div>

        <!-- CTA -->
         <div class="text-center">
            <h2 class="text-3xl font-bold mb-6">Join the revolution</h2>
            <Button size="lg" href="/register" class="h-12 px-8 rounded-full">Sign Up Free</Button>
        </div>
    </div>
</div>
