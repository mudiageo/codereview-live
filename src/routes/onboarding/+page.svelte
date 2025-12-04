<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import Video from '@lucide/svelte/icons/video';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  
  const features = [
    {
      icon: Video,
      title: 'Record Walkthroughs',
      description: 'Show your code changes with video instead of text comments'
    },
    {
      icon: MessageSquare,
      title: 'Video Responses',
      description: 'Get timestamped feedback that actually makes sense'
    },
    {
      icon: Sparkles,
      title: 'AI Insights',
      description: 'Let AI explain complex code and suggest improvements'
    }
  ];
  
  const dots = [true, false, false];
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
  <Card class="w-full max-w-2xl border-border/50 shadow-xl">
    <CardHeader class="text-center space-y-4">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm">
        <Video class="h-10 w-10 text-primary" />
      </div>
      <CardTitle class="text-3xl font-bold">Welcome to CodeReview.live</CardTitle>
      <CardDescription class="text-lg">
        Async video code reviews that actually work
      </CardDescription>
    </CardHeader>
    
    <CardContent class="space-y-6">
      <div class="grid gap-4 md:grid-cols-3">
        {#each features as feature}
          <div class="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-muted/50">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svelte:component this={feature.icon} class="h-6 w-6 text-primary" />
            </div>
            <h3 class="font-semibold">{feature.title}</h3>
            <p class="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        {/each}
      </div>
      
      <!-- Progress Dots -->
      <div class="flex justify-center gap-2">
        {#each dots as active}
          <div class="h-2 w-2 rounded-full {active ? 'bg-primary' : 'bg-muted'}"></div>
        {/each}
      </div>
    </CardContent>
    
    <CardFooter class="flex justify-between">
      <Button variant="ghost" href="/login">Skip</Button>
      <Button href="/onboarding/profile">Get Started</Button>
    </CardFooter>
  </Card>
</div>