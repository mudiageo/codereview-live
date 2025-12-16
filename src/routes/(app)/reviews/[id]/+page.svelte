<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Card, CardContent } from '$lib/components/ui/card';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu';
  import CodeEditor from '$lib/components/code-editor.svelte';
  import VideoPlayer from '$lib/components/video-player.svelte';
  import P2PShareDialog from '$lib/components/p2p-share-dialog.svelte';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Share2 from '@lucide/svelte/icons/share-2';
  import MoreVertical from '@lucide/svelte/icons/more-vertical';
  import Download from '@lucide/svelte/icons/download';
  import Upload from '@lucide/svelte/icons/upload';
  import Users from '@lucide/svelte/icons/users';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Send from '@lucide/svelte/icons/send';
  import VideoIcon from '@lucide/svelte/icons/video';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Check from '@lucide/svelte/icons/check';
  import Play from '@lucide/svelte/icons/play';
  import { toast } from 'svelte-sonner';
  import { reviewsStore, commentsStore } from '$lib/stores/index.svelte';
  import { auth } from '$lib/stores/auth.svelte';
  import { ReviewExporter } from '$lib/utils/export-import';
  
  const reviewId = $derived(page.params.id);
  
  // Load data from stores

  
  // Get review from store
  const review = $derived(reviewsStore.findById(reviewId) || {
    id: reviewId,
    title: 'Review Not Found',
    description: 'This review could not be loaded',
    authorName: 'Unknown',
    authorAvatar: '',
    createdAt: new Date(),
    status: 'draft',
    videoUrl: '',
    videoDuration: 0,
    codeContent: '',
    language: 'text',
  });
  
  // Get comments for this review with threading
  const threadedComments = $derived(commentsStore.getThreaded(reviewId));
  
  let currentTime = $state(0);
  let newComment = $state('');
  let activeTab = $state('diff');
  let showP2PShare = $state(false);
  
  // Prepare video markers from comments
  const videoMarkers = $derived(
    threadedComments
      .filter(c => c.videoTimestamp)
      .map(c => ({ time: c.videoTimestamp, label: c.authorName || 'User' }))
  );
  
  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatTimestamp(date: Date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  }
  
  function handleTimeUpdate(time: number) {
    currentTime = time;
  }
  
  async function postComment() {
    if (!newComment.trim()) return;
    
    try {
      await commentsStore.create({
        reviewId: reviewId,
        authorId: auth.currentUser?.id,
        authorName: auth.currentUser?.name,
        content: newComment,
        videoTimestamp: currentTime > 0 ? Math.floor(currentTime) : undefined,
      });
      toast.success('Comment posted');
      newComment = '';
    } catch (error) {
      console.log(errorl)
      toast.error('Failed to post comment');
    }
  }
  
  async function toggleResolve(commentId: string) {
    try {
      await commentsStore.toggleResolved(commentId);
      toast.success('Comment resolved status updated');
    } catch (error) {
      toast.error('Failed to update comment');
    }
  }
  
  async function explainCode() {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'AI is analyzing the code...',
        success: 'Analysis complete!',
        error: 'Failed to analyze code'
      }
    );
  }
</script>

<div class="h-[calc(100vh-8rem)] flex flex-col">
  <!-- Header -->
  <div class="border-b p-4 space-y-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <Button variant="ghost" size="icon" href="/reviews">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-semibold truncate">{review.title}</h1>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar class="h-5 w-5">
              <AvatarImage src={review.author?.avatar} />
              <AvatarFallback class="text-xs">{getInitials(review.author?.name ||'')}</AvatarFallback>
            </Avatar>
            <span>{review.author?.name}</span>
            <span>·</span>
            <span class="truncate">{review.createdAt}</span>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <Badge variant="outline" class="badge-published">
          {review.status}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger>
            {#snippet child(props)}
            <Button {...props} variant="outline" size="sm" class="gap-2">
              <Share2 class="h-4 w-4" />
              Share
            </Button>
            {/snippet}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Copy Link</DropdownMenuItem>
            <DropdownMenuItem>Export as File</DropdownMenuItem>
            <DropdownMenuItem>P2P Transfer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger>
            {#snippet child(props)}
            <Button {...props} variant="ghost" size="icon">
              <MoreVertical class="h-5 w-5" />
            </Button>
            {/snippet}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onclick={exportReview}>
              <Download class="h-4 w-4 mr-2" />
              Export Review
            </DropdownMenuItem>
            <DropdownMenuItem onclick={shareP2P}>
              <Users class="h-4 w-4 mr-2" />
              Share via P2P
            </DropdownMenuItem>
            <DropdownMenuItem>Edit Review</DropdownMenuItem>
            <DropdownMenuItem>Archive</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>

  <!-- Split View -->
  <div class="flex-1 grid lg:grid-cols-2 overflow-hidden">
    <!-- Left Panel: Code Viewer -->
    <div class="flex flex-col border-r overflow-hidden">
      <!-- Code Header -->
      <div class="border-b p-2 flex items-center justify-between bg-muted/30">
        <Tabs bind:value={activeTab}>
          <TabsList class="h-8">
            <TabsTrigger value="diff" class="text-xs">Diff View</TabsTrigger>
            <TabsTrigger value="full" class="text-xs">Full Code</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div class="flex items-center gap-1">
          <Button variant="ghost" size="sm" onclick={explainCode} class="gap-2 h-8 text-xs">
            <Sparkles class="h-3 w-3" />
            AI Explain
          </Button>
        </div>
      </div>
      
      <!-- Code Content -->
      <div class="flex-1 overflow-auto p-4">
        <CodeEditor
          value={review.codeContent}
          language={review.language}
          readonly={true}
          showLineNumbers={true}
        />
      </div>
    </div>

    <!-- Right Panel: Video & Comments -->
    <div class="flex flex-col overflow-hidden">
      <!-- Video Player -->
      <div class="border-b">
        {#if review.videoUrl}
          <VideoPlayer
            src={review.videoUrl}
            onTimeUpdate={handleTimeUpdate}
            markers={videoMarkers}
          />
        {:else}
          <div class="aspect-video bg-muted flex items-center justify-center">
            <div class="text-center">
              <VideoIcon class="h-16 w-16 text-muted-foreground mb-2 mx-auto" />
              <p class="text-sm text-muted-foreground">No video available</p>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Comments Section -->
      <div class="flex-1 overflow-auto p-4 space-y-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold flex items-center gap-2">
            <MessageSquare class="h-4 w-4" />
            Comments ({threadedComments.length})
          </h3>
          <Button size="sm" variant="outline" class="gap-2">
            <VideoIcon class="h-3 w-3" />
            Video Reply
          </Button>
        </div>
        
        {#if threadedComments.length === 0}
          <Card>
            <CardContent class="flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare class="h-8 w-8 text-muted-foreground mb-2" />
              <p class="text-sm text-muted-foreground">No comments yet</p>
            </CardContent>
          </Card>
        {:else}
          {#each threadedComments as comment}
            <Card>
              <CardContent class="p-4 space-y-3">
                <!-- Comment Header -->
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-2">
                    <Avatar class="h-8 w-8">
                      <AvatarImage src={comment.author?.avatar} />
                      <AvatarFallback class="text-xs">
                        {getInitials(comment.author?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p class="text-sm font-medium">{comment.author?.name}</p>
                      <p class="text-xs text-muted-foreground">{comment.timestamp}</p>
                    </div>
                  </div>
                  
                  {#if comment.videoTimestamp}
                    <Button
                      variant="ghost"
                      size="sm"
                      class="gap-1 h-6 text-xs"
                      onclick={() => seekTo(comment.videoTimestamp)}
                    >
                      <Play class="h-3 w-3" />
                      {formatTime(comment.videoTimestamp)}
                    </Button>
                  {/if}
                </div>
                
                <!-- Comment Content -->
                <p class="text-sm">{comment.content}</p>
                
                <!-- Comment Actions -->
                <div class="flex items-center gap-2">
                  <Button variant="ghost" size="sm" class="h-7 text-xs">
                    Reply
                  </Button>
                  {#if !comment.isResolved}
                    <Button variant="ghost" size="sm" class="h-7 text-xs gap-1">
                      <Check class="h-3 w-3" />
                      Resolve
                    </Button>
                  {/if}
                </div>
                
                <!-- Replies -->
                {#if comment.replies?.length > 0}
                  <div class="ml-6 space-y-3 pt-3 border-t">
                    {#each comment.replies as reply}
                      <div class="flex items-start gap-2">
                        <Avatar class="h-6 w-6">
                          <AvatarImage src={reply.author?.avatar} />
                          <AvatarFallback class="text-xs">
                            {getInitials(reply.author?.name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div class="flex-1">
                          <div class="flex items-center gap-2">
                            <p class="text-sm font-medium">{reply.author?.name}</p>
                            <p class="text-xs text-muted-foreground">{reply.timestamp}</p>
                          </div>
                          <p class="text-sm mt-1">{reply.content}</p>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </CardContent>
            </Card>
          {/each}
        {/if}
      </div>
      
      <!-- New Comment Input -->
      <div class="border-t p-4">
        <div class="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            class="flex-1 resize-none"
            rows={2}
            bind:value={newComment}
          />
          <Button size="icon" onclick={postComment} disabled={!newComment.trim()}>
            <Send class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>

<P2PShareDialog
  bind:open={showP2PShare}
  onClose={() => showP2PShare = false}
  reviewData={review}
/>