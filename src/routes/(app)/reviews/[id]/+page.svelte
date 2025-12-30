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
  import DiffViewer from '$lib/components/diff-viewer.svelte';
  import FileTreeNavigator from '$lib/components/file-tree-navigator.svelte';
  import InlineCommentThread from '$lib/components/inline-comment-thread.svelte';
  import MentionAutocomplete from '$lib/components/mention-autocomplete.svelte';
  import VideoPlayer from '$lib/components/video-player.svelte';
  import P2PShareDialog from '$lib/components/p2p-share-dialog.svelte';

  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Share2 from '@lucide/svelte/icons/share-2';
  import MoreVertical from '@lucide/svelte/icons/more-vertical';
  import Download from '@lucide/svelte/icons/download';
  import Users from '@lucide/svelte/icons/users';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Send from '@lucide/svelte/icons/send';
  import VideoIcon from '@lucide/svelte/icons/video';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Check from '@lucide/svelte/icons/check';
  import Play from '@lucide/svelte/icons/play';

  import { toast } from 'svelte-sonner';
  import { reviewsStore, commentsStore, teamsStore } from '$lib/stores/index.svelte';
  import { auth } from '$lib/stores/auth.svelte';
  import { ReviewExporter } from '$lib/utils/export-import';
  
  const reviewId = $derived(page.params.id);
  const isMobile = $derived(typeof window !== 'undefined' && window.innerWidth < 1024);

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
    files: [],
    teamId: null
  });

  const threadedComments = $derived(commentsStore.getThreaded(reviewId));
  const teamMembers = $derived(review.teamId ? teamsStore.findById(review.teamId)?.members || [] : []);

  let currentTime = $state(0);
  let newComment = $state('');
  let activeTab = $state('diff'); 
  let showP2PShare = $state(false);

  // --- File Tree Integration ---
  const fileTree = $derived(buildFileTree(review?.files || []));
  let currentFilePath = $state(fileTree[0]?.path || '');
  
  function buildFileTree(files: any[]) {
    if (!files || files.length === 0) return [];
    const tree: any[] = [];
 
    for (const file of files) {
      tree.push({
        name: file.filename.split('/').pop() || file.filename,
        path: file.filename,
        type: 'file',
        additions: file.additions || 0,
        deletions: file.deletions || 0
      });

    }
  }
  
  function handleFileSelect(filePath: string) {
    currentFilePath = filePath;
  }
  
  const currentFile = $derived(
    review?.files?.find((f: any) => f.filename === currentFilePath) || {
      content: review.codeContent,
      language: review.language,
      filename: 'main'
    }
  );

  // --- Inline Comments Integration ---
  let activeCommentLine = $state<number | null>(null);

  function handleLineClick(lineNumber: number, filePath: string) {
    activeCommentLine = lineNumber;
  }

  function getCommentsForLine(lineNumber: number) {
    return commentsStore
      .findByReview(review.id)
      .filter(c => c.lineNumber === lineNumber && c.filePath === currentFilePath);
  }

  async function handleAddInlineComment(content: string, lineNumber: number, parentId?: string) {
    try {
      await commentsStore.create({
        reviewId: review.id,
        filePath: currentFilePath,
        lineNumber,
        content,
        parentId,
        authorId: auth.currentUser?.id,
        authorName: auth.currentUser?.name,
        createdAt: new Date(),
        resolved: false
      });
      toast.success('Comment added');
    } catch (e) {
      toast.error('Failed to add comment');
    }
  }

  async function handleResolveThread(lineNumber: number) {
    const comments = getCommentsForLine(lineNumber);
    for (const comment of comments) {
      await commentsStore.toggleResolved(comment.id);
    }
    toast.success('Thread resolved');
  }

  // --- Mentions Integration ---
  let showMentions = $state(false);
  let mentionSearch = $state('');
  let mentionPosition = $state({ top: 0, left: 0 });
  let textareaRef: HTMLTextAreaElement;

  function handleCommentInput(e: Event) {
    const input = e.target as HTMLTextAreaElement;
    newComment = input.value;
    
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      showMentions = true;
      mentionSearch = mentionMatch[1];
      const rect = input.getBoundingClientRect();
      mentionPosition = {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX + (mentionMatch.index || 0) * 8 
      };
    } else {
      showMentions = false;
    }
  }
  
  function handleMentionSelect(member: any) {
    const cursorPos = textareaRef.selectionStart;
    const textBefore = newComment.substring(0, cursorPos);
    const textAfter = newComment.substring(cursorPos);
    newComment = textBefore.replace(/@\w*$/, `@${member.username} `) + textAfter;
    showMentions = false;
    textareaRef.focus();
  }

  // --- Helpers ---
  const videoMarkers = $derived(
    threadedComments
      .filter(c => c.videoTimestamp)
      .map(c => ({ time: c.videoTimestamp, label: c.authorName || 'User' }))
  );

  function getInitials(name: string) {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  }
  
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatTimestamp(date: Date) {
    if (!date) return '';
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

  function exportReview() { ReviewExporter.export(review); }
  function shareP2P() { showP2PShare = true; }
</script>

<div class="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)]">
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
            <span class="truncate">{formatTimestamp(review.createdAt)}</span>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-1 md:gap-2 shrink-0">
        <Badge variant="outline" class="badge-published text-xs">{review.status}</Badge>
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
              <Download class="h-4 w-4 mr-2" /> Export Review
            </DropdownMenuItem>
            <DropdownMenuItem onclick={shareP2P}>
              <Users class="h-4 w-4 mr-2" /> Share via P2P
            </DropdownMenuItem>
            <DropdownMenuItem>Edit Review</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>

  <div class="flex-1 overflow-hidden flex">
    
    {#if !isMobile && fileTree.length > 0}
    <aside class="w-64 border-r overflow-y-auto hidden lg:block bg-background">
      <FileTreeNavigator
        files={fileTree}
        currentFile={currentFilePath}
        onFileSelect={handleFileSelect}
      />
    </aside>
    {/if}

    <div class="flex-1 flex flex-col min-w-0">
      
      <div class="lg:hidden h-full">
        <Tabs bind:value={activeTab} class="h-full flex flex-col">
          <TabsList class="grid w-full grid-cols-3 shrink-0">
            <TabsTrigger value="video" class="text-xs md:text-sm"><VideoIcon class="h-3 w-3 mr-1"/>Video</TabsTrigger>
            <TabsTrigger value="diff" class="text-xs md:text-sm"><MessageSquare class="h-3 w-3 mr-1"/>Code</TabsTrigger>
            <TabsTrigger value="comments" class="text-xs md:text-sm"><MessageSquare class="h-3 w-3 mr-1"/>Discuss</TabsTrigger>
          </TabsList>
          
          <TabsContent value="video" class="flex-1 overflow-auto mt-0">
            {#if review.videoUrl}
              <VideoPlayer src={review.videoUrl} onTimeUpdate={handleTimeUpdate} markers={videoMarkers} />
            {:else}
              <div class="aspect-video bg-muted flex items-center justify-center p-8 text-center text-muted-foreground">
                <div><VideoIcon class="h-8 w-8 mx-auto mb-2"/>No video available</div>
              </div>
            {/if}
          </TabsContent>
          
          <TabsContent value="diff" class="flex-1 overflow-auto mt-0 p-2">
             <div class="mb-2 flex items-center justify-between">
                <Badge variant="outline">{currentFile?.language}</Badge>
                <Button variant="ghost" size="sm" onclick={explainCode} class="gap-1 text-xs"><Sparkles class="h-3 w-3"/> AI Explain</Button>
             </div>
             <DiffViewer
                diff={currentFile?.content || ''}
                filename={currentFile?.filename || 'code'}
                onLineClick={() => {}}
             />
          </TabsContent>
          
          <TabsContent value="comments" class="flex-1 flex flex-col mt-0">
             <div class="flex-1 overflow-auto p-3 space-y-4">
               {#each threadedComments as comment}
                 <Card class="p-3">
                    <div class="flex gap-2">
                       <Avatar class="h-8 w-8"><AvatarImage src={comment.authorAvatar} /><AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback></Avatar>
                       <div class="flex-1">
                          <div class="flex justify-between">
                             <span class="font-medium text-sm">{comment.authorName}</span>
                             <span class="text-xs text-muted-foreground">{formatTimestamp(comment.createdAt)}</span>
                          </div>
                          <p class="text-sm">{comment.content}</p>
                       </div>
                    </div>
                 </Card>
               {/each}
             </div>
             <div class="border-t p-3 bg-background">
                <div class="flex gap-2">
                   <Textarea bind:value={newComment} placeholder="Comment..." class="min-h-[60px] text-sm"/>
                   <Button onclick={postComment} size="icon"><Send class="h-4 w-4"/></Button>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>

      <div class="hidden lg:grid lg:grid-cols-2 h-full">
        <div class="flex flex-col border-r overflow-hidden">
          <div class="border-b p-2 flex items-center justify-between bg-muted/30">
            <Tabs bind:value={activeTab}>
              <TabsList class="h-8">
                <TabsTrigger value="diff" class="text-xs">Diff View</TabsTrigger>
                <TabsTrigger value="full" class="text-xs">Full Code</TabsTrigger>
              </TabsList>
            </Tabs>
            <div class="flex items-center gap-1">
              <span class="text-xs text-muted-foreground mr-2">{currentFilePath}</span>
              <Button variant="ghost" size="sm" onclick={explainCode} class="gap-2 h-8 text-xs"><Sparkles class="h-3 w-3"/> AI Explain</Button>
            </div>
          </div>
          
          <div class="flex-1 overflow-auto relative">
            {#if activeTab === 'diff'}
              <DiffViewer
                diff={currentFile?.content || ''}
                filename={currentFile?.filename || currentFilePath}
                onLineClick={(line) => handleLineClick(line, currentFilePath)}
              />
              
              {#if activeCommentLine !== null}
                <div class="absolute left-10 right-10 z-20 bg-background border rounded-md shadow-lg p-2 animate-in fade-in zoom-in-95" 
                     style="top: {activeCommentLine * 24 + 40}px">
                   <div class="flex justify-between items-center mb-2 px-2 border-b pb-1">
                      <span class="text-xs font-bold flex items-center gap-1"><MessageSquare class="h-3 w-3"/> Line {activeCommentLine}</span>
                      <Button variant="ghost" size="icon" class="h-5 w-5" onclick={() => activeCommentLine = null}>✕</Button>
                   </div>
                   <InlineCommentThread
                      lineNumber={activeCommentLine}
                      filePath={currentFilePath}
                      comments={getCommentsForLine(activeCommentLine)}
                      resolved={getCommentsForLine(activeCommentLine).some(c => c.resolved)}
                      onAddComment={(content, parentId) => handleAddInlineComment(content, activeCommentLine!, parentId)}
                      onResolve={() => handleResolveThread(activeCommentLine!)}
                    />
                </div>
              {/if}
            {:else}
              <CodeEditor
                value={currentFile?.content || ''}
                language={currentFile?.language || 'text'}
                readonly={true}
                showLineNumbers={true}
              />
            {/if}
          </div>
        </div>

        <div class="flex flex-col overflow-hidden">
          <div class="border-b">
            {#if review.videoUrl}
              <VideoPlayer src={review.videoUrl} onTimeUpdate={handleTimeUpdate} markers={videoMarkers} />
            {:else}
              <div class="aspect-video bg-muted flex items-center justify-center">
                 <div class="text-center text-muted-foreground"><VideoIcon class="h-12 w-12 mx-auto mb-2"/><p>No video available</p></div>
              </div>
            {/if}
          </div>
          
          <div class="flex-1 overflow-auto p-4 space-y-4">
             <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold flex items-center gap-2"><MessageSquare class="h-4 w-4"/> Comments ({threadedComments.length})</h3>
             </div>
             
             {#if threadedComments.length === 0}
               <div class="text-center text-muted-foreground py-8">No comments yet</div>
             {:else}
               {#each threadedComments as comment}
                 <Card>
                   <CardContent class="p-4 space-y-3">
                     <div class="flex justify-between">
                        <div class="flex items-center gap-2">
                           <Avatar class="h-8 w-8"><AvatarImage src={comment.authorAvatar} /><AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback></Avatar>
                           <div>
                              <p class="text-sm font-medium">{comment.authorName}</p>
                              <p class="text-xs text-muted-foreground">{formatTimestamp(comment.createdAt)}</p>
                           </div>
                        </div>
                        <Button variant="ghost" size="icon" class="h-6 w-6" onclick={() => toggleResolve(comment.id)}>
                           <Check class="h-3 w-3 {comment.isResolved ? 'text-green-600' : 'text-muted-foreground'}" />
                        </Button>
                     </div>
                     <p class="text-sm">{comment.content}</p>
                     {#if comment.videoTimestamp}
                       <Button variant="ghost" size="sm" class="h-6 text-xs gap-1" onclick={() => currentTime = comment.videoTimestamp}>
                          <Play class="h-3 w-3"/> {formatTime(comment.videoTimestamp)}
                       </Button>
                     {/if}
                   </CardContent>
                 </Card>
               {/each}
             {/if}
          </div>
          
          <div class="border-t p-4 relative">
             <div class="flex gap-2">
                <Textarea 
                  bind:this={textareaRef}
                  bind:value={newComment}
                  oninput={handleCommentInput}
                  placeholder="Add a comment... (Type @ to mention)"
                  class="flex-1 resize-none min-h-[60px]"
                />
                <Button size="icon" onclick={postComment} disabled={!newComment.trim()}><Send class="h-4 w-4"/></Button>
             </div>
             {#if showMentions}
                <div style="position: fixed; top: {mentionPosition.top}px; left: {mentionPosition.left}px; z-index: 50;">
                  <MentionAutocomplete
                    members={teamMembers}
                    search={mentionSearch}
                    onSelect={handleMentionSelect}
                  />
                </div>
             {/if}
          </div>
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