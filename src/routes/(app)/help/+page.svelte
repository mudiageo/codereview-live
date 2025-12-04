<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import Search from '@lucide/svelte/icons/search';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import Video from '@lucide/svelte/icons/video';
  import MessageCircle from '@lucide/svelte/icons/message-circle';
  import Keyboard from '@lucide/svelte/icons/keyboard';
  import HelpCircle from '@lucide/svelte/icons/help-circle';
  import FileText from '@lucide/svelte/icons/file-text';
  
  let searchQuery = $state('');
  
  const categories = [
    {
      title: 'Getting Started',
      icon: BookOpen,
      articles: [
        { title: 'Quick Start Guide', href: '/help/quick-start' },
        { title: 'Creating Your First Review', href: '/help/first-review' },
        { title: 'Understanding Projects', href: '/help/projects' },
      ]
    },
    {
      title: 'Features',
      icon: Video,
      articles: [
        { title: 'Recording Video Walkthroughs', href: '/help/recording' },
        { title: 'Adding Comments', href: '/help/comments' },
        { title: 'Using AI Features', href: '/help/ai-features' },
        { title: 'Sharing Reviews', href: '/help/sharing' },
      ]
    },
    {
      title: 'Account & Billing',
      icon: FileText,
      articles: [
        { title: 'Managing Your Account', href: '/help/account' },
        { title: 'Subscription Plans', href: '/help/plans' },
        { title: 'Payment Methods', href: '/help/payment' },
      ]
    },
    {
      title: 'Keyboard Shortcuts',
      icon: Keyboard,
      articles: [
        { title: 'All Keyboard Shortcuts', href: '/help/shortcuts' },
      ]
    }
  ];
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="text-center space-y-4">
    <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
      <HelpCircle class="h-10 w-10 text-primary" />
    </div>
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Help Center</h1>
      <p class="text-muted-foreground">Find answers and learn about CodeReview.live</p>
    </div>
  </div>

  <!-- Search -->
  <div class="max-w-2xl mx-auto">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search for help..."
        class="pl-10 h-12 text-base"
        bind:value={searchQuery}
      />
    </div>
  </div>

  <!-- Categories -->
  <div class="grid gap-6 md:grid-cols-2">
    {#each categories as category}
      <Card>
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <svelte:component this={category.icon} class="h-5 w-5 text-primary" />
            </div>
            <CardTitle>{category.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul class="space-y-2">
            {#each category.articles as article}
              <li>
                <a
                  href={article.href}
                  class="text-sm hover:text-primary transition-colors hover:underline"
                >
                  {article.title}
                </a>
              </li>
            {/each}
          </ul>
        </CardContent>
      </Card>
    {/each}
  </div>

  <!-- Contact Support -->
  <Card class="bg-primary/5 border-primary/20">
    <CardContent class="flex items-center justify-between p-6">
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <MessageCircle class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 class="font-semibold">Still need help?</h3>
          <p class="text-sm text-muted-foreground">Our support team is here for you</p>
        </div>
      </div>
      <Button>Contact Support</Button>
    </CardContent>
  </Card>
</div>