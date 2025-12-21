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

<div class="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)]">
  <!-- Header -->
  <div class="border-b p-3 md:p-4 space-y-2">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
        <Button variant="ghost" size="icon" href="/reviews" class="shrink-0">
          <ArrowLeft class="h-4 w-4 md:h-5 md:w-5" />
        </Button>
        <div class="flex-1 min-w-0">
          <h1 class="text-base md:text-xl font-semibold truncate">{review.title}</h1>
          <div class="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <Avatar class="h-4 w-4 md:h-5 md:w-5">
              <AvatarImage src={review.author?.avatar} />
              <AvatarFallback class="text-[10px] md:text-xs">{getInitials(review.author?.name ||'')}</AvatarFallback>
            </Avatar>
            <span class="hidden sm:inline">{review.author?.name}</span>
            <span class="hidden sm:inline">·</span>
            <span class="truncate">{review.createdAt}</span>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-1 md:gap-2 shrink-0">
        <Badge variant="outline" class="badge-published text-xs">
          {review.status}
        </Badge>
        
        <Button variant="outline" size="sm" class="gap-1 hidden sm:flex text-xs">
          <Share2 class="h-3 w-3 md:h-4 md:w-4" />
          <span class="hidden md:inline">Share</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger>
            {#snippet child(props)}
            <Button {...props} variant="ghost" size="icon" class="h-8 w-8 md:h-10 md:w-10">
              <MoreVertical class="h-4 w-4 md:h-5 md:w-5" />
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

  <!-- Content Area - Responsive Layout -->
  <div class="flex-1 overflow-hidden">
    <!-- Mobile & Tablet: Tabs -->
    <div class="lg:hidden h-full">
      <Tabs bind:value={activeTab} class="h-full flex flex-col">
        <TabsList class="grid w-full grid-cols-3 shrink-0">
          <TabsTrigger value="video" class="text-xs md:text-sm">
            <VideoIcon class="h-3 w-3 md:h-4 md:w-4 mr-1" />
            Video
          </TabsTrigger>
          <TabsTrigger value="code" class="text-xs md:text-sm">
            <svg class="h-3 w-3 md:h-4 md:w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            Code
          </TabsTrigger>
          <TabsTrigger value="comments" class="text-xs md:text-sm">
            <MessageSquare class="h-3 w-3 md:h-4 md:w-4 mr-1" />
            Comments
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="video" class="flex-1 overflow-auto mt-0">
          {#if review.videoUrl}
            <VideoPlayer
              src={review.videoUrl}
              onTimeUpdate={handleTimeUpdate}
              markers={videoMarkers}
            />
          {:else}
            <div class="aspect-video bg-muted flex items-center justify-center">
              <div class="text-center text-muted-foreground">
                <VideoIcon class="h-12 w-12 mx-auto mb-2" />
                <p>No video available</p>
              </div>
            </div>
          {/if}
        </TabsContent>
        
        <TabsContent value="code" class="flex-1 overflow-auto mt-0 p-2 md:p-4">
          <div class="mb-2 flex items-center justify-between">
            <Badge variant="outline">{review.language}</Badge>
            <Button variant="ghost" size="sm" onclick={explainCode} class="gap-1 text-xs">
              <Sparkles class="h-3 w-3" />
              AI Explain
            </Button>
          </div>
          <CodeEditor
            value={review.codeContent}
            language={review.language}
            readonly={true}
            showLineNumbers={true}
          />
        </TabsContent>
        
        <TabsContent value="comments" class="flex-1 flex flex-col mt-0">
          <div class="flex-1 overflow-auto p-3 md:p-4 space-y-4">
            {#if threadedComments.length === 0}
              <div class="text-center py-8 text-muted-foreground">
                <MessageSquare class="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No comments yet</p>
                <p class="text-sm">Be the first to comment!</p>
              </div>
            {:else}
              {#each threadedComments as comment}
                <Card class="p-3">
                  <div class="flex gap-2">
                    <Avatar class="h-8 w-8 shrink-0">
                      <AvatarImage src={comment.authorAvatar} />
                      <AvatarFallback class="text-xs">{getInitials(comment.authorName)}</AvatarFallback>
                    </Avatar>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-2 mb-1">
                        <div class="flex-1 min-w-0">
                          <span class="font-medium text-sm truncate block">{comment.authorName}</span>
                          <span class="text-xs text-muted-foreground">{formatTimestamp(comment.createdAt)}</span>
                        </div>
                        <Button variant="ghost" size="icon" class="h-6 w-6 shrink-0" onclick={() => toggleResolved(comment.id)}>
                          <Check class="h-3 w-3 {comment.isResolved ? 'text-green-600' : 'text-muted-foreground'}" />
                        </Button>
                      </div>
                      <p class="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                      {#if comment.videoTimestamp}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          class="mt-2 h-7 text-xs gap-1"
                          onclick={() => currentTime = comment.videoTimestamp}
                        >
                          <Play class="h-3 w-3" />
                          {formatTime(comment.videoTimestamp)}
                        </Button>
                      {/if}
                    </div>
                  </div>
                </Card>
              {/each}
            {/if}
          </div>
          
          <div class="border-t p-3 md:p-4 bg-background">
            <div class="flex gap-2">
              <Textarea 
                bind:value={newComment}
                placeholder="Add a comment..."
                class="min-h-[60px] text-sm"
              />
              <Button onclick={postComment} size="icon" class="shrink-0">
                <Send class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    
    <!-- Desktop: Split View -->
    <div class="hidden lg:grid lg:grid-cols-2 h-full">
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
    </div> <!-- End Right Panel -->
  </div> <!-- End Desktop Grid -->
  </div> <!-- End Content Area -->
</div> <!-- End Main Container -->

<P2PShareDialog
  bind:open={showP2PShare}
  onClose={() => showP2PShare = false}
  reviewData={review}
/>