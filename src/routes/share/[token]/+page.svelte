<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import CodeEditor from '$lib/components/code-editor.svelte';
  import Eye from '@lucide/svelte/icons/eye';
  import Download from '@lucide/svelte/icons/download';
  import Share2 from '@lucide/svelte/icons/share-2';
  import Lock from '@lucide/svelte/icons/lock';
  
  const token = $derived($page.params.token);
  
  // Mock data - fetch based on token
  const review = {
    id: '1',
    title: 'Add JWT Authentication to API',
    author: { name: 'John Doe', avatar: '' },
    createdAt: '2 hours ago',
    codeContent: '// Sample code...',
    language: 'javascript',
    isPublic: true,
    requiresAuth: false
  };
  
  let requiresLogin = $state(false);
  
  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
  <div class="max-w-5xl mx-auto p-6 space-y-6">
    {#if requiresLogin}
      <Card class="max-w-md mx-auto mt-20">
        <CardHeader class="text-center space-y-3">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Lock class="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Sign In Required</CardTitle>
          <p class="text-sm text-muted-foreground">
            This review is private. Please sign in to view it.
          </p>
        </CardHeader>
        <CardContent class="space-y-2">
          <Button href="/login?redirect=/share/{token}" class="w-full">
            Sign In
          </Button>
          <Button href="/signup" variant="outline" class="w-full">
            Create Account
          </Button>
        </CardContent>
      </Card>
    {:else}
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Avatar class="h-10 w-10">
            <AvatarImage src={review.author.avatar} />
            <AvatarFallback>{getInitials(review.author.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p class="font-medium">{review.author.name}</p>
            <p class="text-sm text-muted-foreground">Shared {review.createdAt}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" class="gap-2">
            <Download class="h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm" class="gap-2">
            <Share2 class="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <!-- Review Content -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle class="text-2xl">{review.title}</CardTitle>
            <Badge variant="outline" class="gap-1">
              <Eye class="h-3 w-3" />
              Public
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <CodeEditor
            value={review.codeContent}
            language={review.language}
            readonly
          />
        </CardContent>
      </Card>

      <!-- CTA -->
      <Card class="bg-primary/5 border-primary/20">
        <CardContent class="flex items-center justify-between p-6">
          <div>
            <h3 class="font-semibold text-lg mb-1">Want to create your own reviews?</h3>
            <p class="text-sm text-muted-foreground">
              Join CodeReview.live and start collaborating with your team
            </p>
          </div>
          <Button href="/signup">Get Started Free</Button>
        </CardContent>
      </Card>
    {/if}
  </div>
</div>