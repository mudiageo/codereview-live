<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import { Badge } from '$lib/components/ui/badge';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Check from '@lucide/svelte/icons/check';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Mic from '@lucide/svelte/icons/mic';
  import Video from '@lucide/svelte/icons/video';
  import { auth } from '$lib/stores/auth.svelte';
  import CommentMedia from './comment-media.svelte';
  import CommentRecorder from './comment-recorder.svelte';
  
  interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    createdAt: Date;
    media?: {
      type: 'video' | 'audio';
      url: string;
      thumbnailUrl?: string;
      metadata?: any;
    };
    replies?: Comment[];
  }
  
  interface Props {
    lineNumber: number;
    filePath: string;
    comments: Comment[];
    resolved?: boolean;
    onAddComment: (content: string, parentId?: string) => void;
    onResolve: () => void;
  }
  
  let {
    lineNumber,
    filePath,
    comments = [],
    resolved = false,
    onAddComment,
    onResolve
  }: Props = $props();
  
  let newComment = $state('');
  let replyTo = $state<string | null>(null);
  let replyContent = $state('');
  let collapsed = $state(false);
  let showRecorder = $state(false);
  
  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  function formatTimestamp(date: Date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  }
  
  function handleAddComment(media?: Comment['media']) {
    if (newComment.trim() || media) {
      // In a real app, you would pass the media object to onAddComment
      // For this implementation, we'll append the media URL to the content if it's not structured in the backend
      // But the interface suggests we can handle structure.
      // We'll pass the content, and if onAddComment supports extra args, good.
      // If not, we append markdown.

      let content = newComment;
      if (media) {
         // Assuming markdown support for fallback
         if (media.type === 'video') content += `\n\n[Video](${media.url})`;
         else content += `\n\n[Audio](${media.url})`;
      }

      // Ideally update onAddComment signature, but for now:
      onAddComment(content);
      newComment = '';
      showRecorder = false;
    }
  }
  
  function handleAddReply(parentId: string) {
    if (replyContent.trim()) {
      onAddComment(replyContent, parentId);
      replyContent = '';
      replyTo = null;
    }
  }

  function handleMediaRecorded(media: { type: 'video' | 'audio'; url: string; metadata?: any }) {
    // Determine if we are replying or adding a new thread
    if (replyTo) {
       // Append to reply
       replyContent += `\n\n[${media.type === 'video' ? 'Video' : 'Audio'}](${media.url})`;
       // Or handle immediately?
       // Just appending for now to let user review before sending
    } else {
       handleAddComment({ ...media, thumbnailUrl: media.metadata?.thumbnailUrl });
    }
    showRecorder = false;
  }
</script>

<div class="border-l-2 bg-muted/50 p-3" class:border-blue-500={!resolved} class:border-green-500={resolved}>
  <!-- Thread Header -->
  <div class="mb-2 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <MessageSquare class="h-4 w-4 text-muted-foreground" />
      <span class="text-xs font-medium">Line {lineNumber}</span>
      {#if resolved}
        <Badge variant="outline" class="gap-1 text-xs">
          <Check class="h-3 w-3" />
          Resolved
        </Badge>
      {/if}
    </div>
    
    <div class="flex gap-1">
      {#if !resolved && auth.currentUser}
        <Button
          size="sm"
          variant="ghost"
          class="h-6 px-2 text-xs"
          onclick={onResolve}
        >
          Resolve
        </Button>
      {/if}
      
      <Button
        size="sm"
        variant="ghost"
        class="h-6 w-6 p-0"
        onclick={() => collapsed = !collapsed}
      >
        {#if collapsed}
          <ChevronDown class="h-4 w-4" />
        {:else}
          <ChevronUp class="h-4 w-4" />
        {/if}
      </Button>
    </div>
  </div>
  
  {#if !collapsed}
    <!-- Comments -->
    <div class="space-y-3">
      {#each comments as comment}
        <div class="rounded-lg bg-background p-3">
          <div class="mb-2 flex items-start gap-2">
            <Avatar class="h-6 w-6">
              {#if comment.authorAvatar}
                <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
              {/if}
              <AvatarFallback class="text-xs">
                {getInitials(comment.authorName)}
              </AvatarFallback>
            </Avatar>
            
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium">{comment.authorName}</span>
                <span class="text-xs text-muted-foreground">
                  {formatTimestamp(comment.createdAt)}
                </span>
              </div>
              <p class="mt-1 text-sm">{comment.content}</p>
              {#if comment.media}
                <CommentMedia
                  type={comment.media.type}
                  url={comment.media.url}
                  thumbnailUrl={comment.media.thumbnailUrl}
                  metadata={comment.media.metadata}
                />
              {/if}
              <!-- Attempt to parse markdown link to media if explicit media field missing -->
              {#if !comment.media && (comment.content.includes('[Video](') || comment.content.includes('[Audio]('))}
                  {@const match = comment.content.match(/\[(Video|Audio)\]\((.*?)\)/)}
                  {#if match}
                    <CommentMedia
                      type={match[1].toLowerCase() as 'video' | 'audio'}
                      url={match[2]}
                    />
                  {/if}
              {/if}
            </div>
          </div>
          
          <!-- Replies -->
          {#if comment.replies && comment.replies.length > 0}
            <div class="ml-6 mt-2 space-y-2 border-l-2 pl-3">
              {#each comment.replies as reply}
                <div class="rounded-lg bg-muted/50 p-2">
                  <div class="mb-1 flex items-center gap-2">
                    <Avatar class="h-5 w-5">
                      {#if reply.authorAvatar}
                        <AvatarImage src={reply.authorAvatar} alt={reply.authorName} />
                      {/if}
                      <AvatarFallback class="text-xs">
                        {getInitials(reply.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <span class="text-xs font-medium">{reply.authorName}</span>
                    <span class="text-xs text-muted-foreground">
                      {formatTimestamp(reply.createdAt)}
                    </span>
                  </div>
                  <p class="text-xs">{reply.content}</p>
                </div>
              {/each}
            </div>
          {/if}
          
          <!-- Reply Button -->
          {#if replyTo !== comment.id}
            <Button
              size="sm"
              variant="ghost"
              class="mt-2 h-7 px-2 text-xs"
              onclick={() => replyTo = comment.id}
            >
              Reply
            </Button>
          {/if}
          
          <!-- Reply Form -->
          {#if replyTo === comment.id}
            <div class="mt-2 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                class="min-h-[60px] text-sm"
                bind:value={replyContent}
              />
              <div class="flex gap-2">
                <Button
                  size="sm"
                  onclick={() => handleAddReply(comment.id)}
                >
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onclick={() => {
                    replyTo = null;
                    replyContent = '';
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
    
    <!-- New Comment Form -->
    {#if auth.currentUser && comments.length === 0}
      <div class="mt-2 space-y-2">
        {#if !showRecorder}
          <Textarea
            placeholder="Start a conversation..."
            class="min-h-[80px] text-sm"
            bind:value={newComment}
          />
          <div class="flex justify-between items-center">
            <div class="flex gap-1">
              <Button size="sm" variant="ghost" onclick={() => showRecorder = true} title="Record Audio/Video">
                <Mic class="h-4 w-4 mr-1" />
                /
                <Video class="h-4 w-4 ml-1" />
              </Button>
            </div>
            <Button size="sm" onclick={() => handleAddComment()}>
              Comment
            </Button>
          </div>
        {:else}
          <CommentRecorder
            onRecordingComplete={handleMediaRecorded}
            onCancel={() => showRecorder = false}
          />
        {/if}
      </div>
    {/if}
  {/if}
</div>
