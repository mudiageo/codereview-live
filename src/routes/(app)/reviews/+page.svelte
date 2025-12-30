<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from '$lib/components/ui/select';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import Filter from '@lucide/svelte/icons/filter';
  import FileVideo from '@lucide/svelte/icons/file-video';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Eye from '@lucide/svelte/icons/eye';
  import Clock from '@lucide/svelte/icons/clock';
  import { reviewsStore } from '$lib/stores/index.svelte';
  import { SearchEngine } from '$lib/utils/search';
  import VirtualList from '$lib/components/virtual-list.svelte';
  
  let searchQuery = $state('');
  let statusFilter = $state('all');
  let sortBy = $state('recent');
  
  const allReviews = $derived(reviewsStore.data || []);
  
  const filteredReviews = $derived.by(() => {
    let results = searchQuery 
      ? SearchEngine.searchReviews(allReviews, searchQuery).map(r => r.item) || []
      : allReviews;
    if (statusFilter !== 'all') {
      results = results.filter(r => r.status === statusFilter);
    }
    
    return results;
  });
  
  
  const shouldUseVirtualList = $derived(filteredReviews().length > 50);
  
  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'published': return 'badge-published';
      case 'draft': return 'badge-draft';
      case 'archived': return 'badge-archived';
      default: return '';
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Reviews</h1>
      <p class="text-muted-foreground">All your code reviews in one place</p>
    </div>
    <Button href="/reviews/new" class="gap-2">
      <Plus class="h-4 w-4" />
      New Review
    </Button>
  </div>

  <!-- Filters -->
  <div class="flex items-center gap-4">
    <div class="relative flex-1 max-w-md">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search reviews..."
        class="pl-9"
        bind:value={searchQuery}
      />
    </div>
    
    <Tabs bind:value={statusFilter}>
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="published">Published</TabsTrigger>
        <TabsTrigger value="draft">Drafts</TabsTrigger>
        <TabsTrigger value="archived">Archived</TabsTrigger>
      </TabsList>
    </Tabs>
    
    <Select type="single" bind:value={sortBy}>
      <SelectTrigger class="w-[180px]">
        {sortBy || "Sort by"}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recent">Most Recent</SelectItem>
        <SelectItem value="oldest">Oldest First</SelectItem>
        <SelectItem value="comments">Most Comments</SelectItem>
        <SelectItem value="views">Most Views</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <!-- Reviews Grid -->
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {#each filteredReviews as review}
      <a href="/reviews/{review.id}" class="group">
        <Card class="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
          <!-- Thumbnail -->
          <div class="relative aspect-video bg-muted">
            {#if review.thumbnail}
              <img src={review.thumbnail} alt="" class="object-cover w-full h-full" />
            {:else}
              <div class="absolute inset-0 flex items-center justify-center">
                <FileVideo class="h-12 w-12 text-muted-foreground" />
              </div>
            {/if}
            
            <Badge class="absolute bottom-2 right-2 bg-black/80 hover:bg-black/80">
              <Clock class="h-3 w-3 mr-1" />
              {review.duration}
            </Badge>
          </div>

          <CardHeader class="space-y-2">
            <CardTitle class="line-clamp-2 group-hover:text-primary transition-colors">
              {review.title}
            </CardTitle>
            
            <div class="flex items-center space-x-2 text-sm text-muted-foreground">
              <Avatar class="h-6 w-6">
                <AvatarImage src={review.author?.avatar} />
                <AvatarFallback class="text-xs">
                  {getInitials(review.author?.name || 'User')}
                </AvatarFallback>
              </Avatar>
              <span class="truncate">{review.author?.name}</span>
              <span>·</span>
              <span>{review.createdAt}</span>
            </div>
            
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" class="text-xs">{review.project}</Badge>
            </div>

            <div class="flex items-center justify-between pt-2">
              <div class="flex items-center space-x-3 text-sm text-muted-foreground">
                <div class="flex items-center space-x-1">
                  <MessageSquare class="h-4 w-4" />
                  <span>{review.commentCount}</span>
                </div>
                <div class="flex items-center space-x-1">
                  <Eye class="h-4 w-4" />
                  <span>{review.viewCount}</span>
                </div>
              </div>
              <Badge variant="outline" class={getStatusColor(review.status)}>
                {review.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </a>
    {/each}
  </div>
</div>