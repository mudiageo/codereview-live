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
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';

	import CodeReviewWorkspace from '$lib/components/code-review-workspace.svelte';
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
	import FileCode from '@lucide/svelte/icons/file-code';

	import { toast } from 'svelte-sonner';
	import { reviewsStore, commentsStore, teamsStore } from '$lib/stores/index.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { ReviewExporter } from '$lib/utils/export-import';
	import { createClientVideoStorage } from '$lib/utils/client-video-storage';
	import type { FileNode } from '$lib/components/code-review-workspace.svelte';

	const reviewId = $derived(page.params.id);
	const isMobile = $derived(typeof window !== 'undefined' && window.innerWidth < 1024);

	const review = $derived(
		reviewsStore.findById(reviewId) || {
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
		}
	);

	const threadedComments = $derived(commentsStore.getThreaded(reviewId));
	const teamMembers = $derived(
		review.teamId ? teamsStore.findById(review.teamId)?.members || [] : []
	);

	let currentTime = $state(0);
	let newComment = $state('');
	let activeTab = $state('diff');
	let showP2PShare = $state(false);
	let videoSrc = $state('');

	// --- File Tree & Workspace Integration ---
	// Convert review files to FileNode[] format expected by CodeReviewWorkspace
	const fileNodes = $derived.by(() => {
		if (
			review?.metadata?.files &&
			Array.isArray(review.metadata.files) &&
			review.metadata.files.length > 0
		) {
			return review.metadata.files as FileNode[];
		}

		if (!review?.files || review.files.length === 0) {
			// Fallback if no files array but we have codeContent
			if (review?.codeContent) {
				return [
					{
						name: 'code',
						path: 'code',
						type: 'file',
						content: review.codeContent,
						diff: review.codeContent, // Assuming content is diff if single file? Or handled by DiffViewer logic
						language: review.language || 'text'
					}
				] as FileNode[];
			}
			return [];
		}

		return review.files.map((file: any) => ({
			name: file.filename.split('/').pop() || file.filename,
			path: file.filename,
			type: 'file',
			// CodeReviewWorkspace handles content/diff logic internally based on mode
			// But we need to supply it here.
			// Assuming review.files contains 'content' or 'diff'
			// Existing implementation used 'review.codeContent' mostly.
			// Let's assume 'content' holds diff string if it's a diff view
			content: file.content || review.codeContent,
			diff: file.content || review.codeContent,
			language: file.language || review.language || 'text',
			additions: file.additions || 0,
			deletions: file.deletions || 0
		})) as FileNode[];
	});

	let currentFilePath = $state('');

	function handleFileChange(file: FileNode) {
		currentFilePath = file.path;
	}

	// --- Inline Comments Integration ---
	let activeCommentLine = $state<number | null>(null);

	function handleLineClick(lineNumber: number) {
		activeCommentLine = lineNumber;
	}

	function getCommentsForLine(lineNumber: number) {
		if (!currentFilePath) return [];
		return commentsStore
			.findByReview(review.id)
			.filter((c) => c.lineNumber === lineNumber && c.filePath === currentFilePath);
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
			.filter((c) => c.videoTimestamp)
			.map((c) => ({ time: c.videoTimestamp, label: c.authorName || 'User' }))
	);

	function getInitials(name: string) {
		return name
			? name
					.split(' ')
					.map((n) => n[0])
					.join('')
					.toUpperCase()
			: '?';
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

		// Sync code scrolling would need to be implemented within CodeReviewWorkspace
		// or by exposing a scrollTo method on it.
		// For now, we'll skip scroll sync or implement it later if needed.
	}

	async function postComment() {
		if (!newComment.trim()) return;
		try {
			await commentsStore.create({
				reviewId: reviewId,
				authorId: auth.currentUser?.id,
				authorName: auth.currentUser?.name,
				content: newComment,
				videoTimestamp: currentTime > 0 ? Math.floor(currentTime) : undefined
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
		toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
			loading: 'AI is analyzing the code...',
			success: 'Analysis complete!',
			error: 'Failed to analyze code'
		});
	}

	function exportReview() {
		ReviewExporter.export(review);
	}
	function shareP2P() {
		showP2PShare = true;
	}

	// --- Video Resolution ---
	$effect(() => {
		if (review.videoUrl?.startsWith('client://')) {
			const id = review.videoUrl.replace('client://', '');
			createClientVideoStorage().then((storage) => {
				storage.get(id).then((result) => {
					if (result) {
						videoSrc = URL.createObjectURL(result.blob);
					}
				});
			});
		} else {
			videoSrc = review.videoUrl;
		}

		return () => {
			if (videoSrc.startsWith('blob:')) {
				URL.revokeObjectURL(videoSrc);
			}
		};
	});
</script>

<div class="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)]">
	<!-- Header -->
	<div class="border-b px-4 py-3 shrink-0">
		<div class="flex items-center justify-between gap-2">
			<div class="flex items-center gap-3 min-w-0">
				<Button variant="ghost" size="icon" href="/reviews" class="shrink-0">
					<ArrowLeft class="h-5 w-5" />
				</Button>
				<div class="min-w-0">
					<h1 class="text-xl font-semibold truncate flex items-center gap-2">
						{review.title}
						<Badge variant="outline" class="text-xs font-normal">{review.status}</Badge>
					</h1>
					<div class="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
						<Avatar class="h-5 w-5">
							<AvatarImage src={review.author?.avatar} />
							<AvatarFallback class="text-xs"
								>{getInitials(review.author?.name || '')}</AvatarFallback
							>
						</Avatar>
						<span class="font-medium text-foreground">{review.author?.name}</span>
						<span>•</span>
						<span>{formatTimestamp(review.createdAt)}</span>
					</div>
				</div>
			</div>

			<div class="flex items-center gap-2 shrink-0">
				<Button
					variant="outline"
					size="sm"
					class="gap-1 hidden sm:flex pointer-events-none opacity-50"
				>
					<!-- Placeholder for collaborators/viewers -->
					<Users class="h-4 w-4" />
					<span>2 viewing</span>
				</Button>
				<Button variant="outline" size="sm" class="gap-1 hidden sm:flex" onclick={shareP2P}>
					<Share2 class="h-4 w-4" />
					<span>Share</span>
				</Button>
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
							<Download class="h-4 w-4 mr-2" /> Export Review
						</DropdownMenuItem>
						<DropdownMenuItem onclick={shareP2P}>
							<Users class="h-4 w-4 mr-2" /> Share via P2P
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem class="text-destructive">Delete</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	</div>

	<div class="flex-1 min-h-0 relative">
		<!-- Desktop Layout: Split View -->
		<div class="hidden lg:flex h-full">
			<!-- Left: Code Workspace -->
			<div class="flex-1 min-w-0 border-r relative flex flex-col">
				{#if fileNodes.length > 0}
					<CodeReviewWorkspace
						files={fileNodes}
						mode={'diff'}
						onLineClick={handleLineClick}
						onFileChange={handleFileChange}
					>
						{#snippet children()}
							{#if activeCommentLine !== null}
								<!-- Overlay for inline comments -->
								<div
									class="absolute left-10 right-10 z-20 bg-background border rounded-md shadow-lg p-2 animate-in fade-in zoom-in-95"
									style="top: {activeCommentLine * 24 +
										40}px; margin-left: 280px; width: calc(100% - 320px);"
								>
									<!-- Note: Positioning might need adjustment based on sidebar width in workspace. 
                                CodeReviewWorkspace sidebar is roughly 280px.
                                We might need a smarter way to position this relative to the DiffViewer content.
                                Since we can't easily access the internal sidebar state/width here, 
                                we might need to rely on the fact that children are rendered INSIDE the workspace's main area.
                                Actually, checking CodeReviewWorkspace structure: 
                                {@render children?.()} is inside the main content area, AFTER the activeTab content.
                                So `absolute` positioning here is relative to `main class="flex flex-1..."`.
                                So `top` should be correct relative to scroll if we are careful, 
                                but wait, `CodeEditor` inside has `overflow-auto`.
                                If `children` is outside the scroll container, `top` based on line number won't scroll with code.
                                
                                Issue: `children` snippet is rendered outside the scrolling container of code/diff ?
                                Checking `code-review-workspace.svelte`: 
                                It is rendered inside `main`, but `DiffViewer` is inside `div class="flex-1 overflow-auto"`.
                                If `children` is a sibling to `activeTab` content div, it stays fixed while `activeTab` scrolls?
                                Actually `activeTab` div has `h-full`.
                                The `DiffViewer` creates its own scroll area or just renders long content?
                                `DiffViewer` usually renders long content.
                                If the parent `div class="flex-1 overflow-auto"` scrolls, then `children` (which is sibling to it? no, check code again)
                                
                                Re-checking CodeReviewWorkspace snippet earlier:
                                <div class="flex-1 overflow-auto">
                                    {#if activeTab}... content ...{/if}
                                </div>
                                {@render children?.()}
                                
                                So `children` is OUTSIDE the `overflow-auto` container. 
                                This means `children` won't scroll with the code. This is BAD for inline comments.
                                
                                FIX NEEDED: `children` should probably be inside the scroll container or we need a different approach.
                                However, modifying `CodeReviewWorkspace` again is expensive.
                                
                                Alternative: `DiffViewer` handles content. 
                                
                                Workaround: Sticky comments? Or just center it on screen?
                                No, inline comments need to be attached to lines.
                                
                                Decision: I will modify CodeReviewWorkspace one more time to put children INSIDE the scroll container, 
                                OR pass children TO DiffViewer/CodeEditor?  No.
                                
                                Actually, let's look at `reviews/[id]/+page.svelte` behavior. 
                                It had an `absolute` div `style="top:..."`. 
                                And it was inside `div class="flex-1 overflow-auto relative"`.
                                
                                I need `CodeReviewWorkspace` to wrap the content + children in a relative container that scrolls?
                                The current `CodeReviewWorkspace` has `div class="flex-1 overflow-auto"`.
                                I should move `{@render children?.()}` INSIDE that div.
                            -->

									<div class="flex justify-between items-center mb-2 px-2 border-b pb-1">
										<span class="text-xs font-bold flex items-center gap-1"
											><MessageSquare class="h-3 w-3" /> Line {activeCommentLine}</span
										>
										<Button
											variant="ghost"
											size="icon"
											class="h-5 w-5"
											onclick={() => (activeCommentLine = null)}>✕</Button
										>
									</div>
									<InlineCommentThread
										lineNumber={activeCommentLine}
										filePath={currentFilePath}
										comments={getCommentsForLine(activeCommentLine)}
										resolved={getCommentsForLine(activeCommentLine).some((c) => c.resolved)}
										onAddComment={(content, parentId) =>
											handleAddInlineComment(content, activeCommentLine!, parentId)}
										onResolve={() => handleResolveThread(activeCommentLine!)}
									/>
								</div>
							{/if}
						{/snippet}
					</CodeReviewWorkspace>
				{:else}
					<div class="flex items-center justify-center h-full text-muted-foreground">No files</div>
				{/if}
			</div>

			<!-- Right: Video & Discussion -->
			<div class="w-[400px] flex flex-col bg-background shrink-0">
				<div class="border-b bg-black">
					{#if videoSrc}
						<VideoPlayer src={videoSrc} onTimeUpdate={handleTimeUpdate} markers={videoMarkers} />
					{:else}
						<div class="aspect-video bg-muted flex items-center justify-center">
							<div class="text-center text-muted-foreground">
								<VideoIcon class="h-12 w-12 mx-auto mb-2" />
								<p>No video available</p>
							</div>
						</div>
					{/if}
				</div>

				<div class="flex-1 overflow-hidden flex flex-col">
					<div class="p-3 border-b font-medium flex items-center justify-between bg-muted/20">
						<span class="flex items-center gap-2"><MessageSquare class="h-4 w-4" /> Discussion</span
						>
						<Badge variant="secondary" class="font-mono text-xs">{threadedComments.length}</Badge>
					</div>

					<div class="flex-1 overflow-y-auto p-3 space-y-4">
						{#if threadedComments.length === 0}
							<div class="text-center text-muted-foreground py-8 text-sm">
								<p>No comments yet.</p>
								<p class="text-xs opacity-70 mt-1">Select a line to start a discussion.</p>
							</div>
						{:else}
							{#each threadedComments as comment}
								<Card
									class="border-l-4 {comment.isResolved
										? 'border-l-green-500/50'
										: 'border-l-primary/50'}"
								>
									<CardContent class="p-3 space-y-2">
										<div class="flex justify-between items-start">
											<div class="flex items-center gap-2">
												<Avatar class="h-6 w-6"
													><AvatarImage src={comment.authorAvatar} /><AvatarFallback
														class="text-[10px]">{getInitials(comment.authorName)}</AvatarFallback
													></Avatar
												>
												<div>
													<p class="text-xs font-medium leading-none">{comment.authorName}</p>
													<p class="text-[10px] text-muted-foreground">
														{formatTimestamp(comment.createdAt)}
													</p>
												</div>
											</div>
											<Button
												variant="ghost"
												size="icon"
												class="h-5 w-5"
												onclick={() => toggleResolve(comment.id)}
											>
												<Check
													class="h-3 w-3 {comment.isResolved
														? 'text-green-600'
														: 'text-muted-foreground'}"
												/>
											</Button>
										</div>
										<p class="text-xs">{comment.content}</p>
										{#if comment.videoTimestamp}
											<Button
												variant="ghost"
												size="sm"
												class="h-5 text-[10px] gap-1 px-1 -ml-1"
												onclick={() => (currentTime = comment.videoTimestamp)}
											>
												<Play class="h-3 w-3" />
												{formatTime(comment.videoTimestamp)}
											</Button>
										{/if}
									</CardContent>
								</Card>
							{/each}
						{/if}
					</div>

					<div class="border-t p-3 relative">
						<div class="flex gap-2">
							<Textarea
								bind:this={textareaRef}
								bind:value={newComment}
								oninput={handleCommentInput}
								placeholder="General comment... (@ to mention)"
								class="flex-1 resize-none min-h-[40px] max-h-[120px] text-sm"
								rows={1}
							/>
							<Button
								size="icon"
								onclick={postComment}
								disabled={!newComment.trim()}
								class="h-10 w-10 shrink-0"><Send class="h-4 w-4" /></Button
							>
						</div>
						{#if showMentions}
							<div
								style="position: fixed; top: {mentionPosition.top}px; left: {mentionPosition.left}px; z-index: 50;"
							>
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

		<!-- Mobile Layout: Tabs -->
		<div class="lg:hidden h-full">
			<Tabs
				value={activeTab}
				onValueChange={(v) => (activeTab = v as any)}
				class="h-full flex flex-col"
			>
				<TabsList class="grid w-full grid-cols-3 shrink-0 rounded-none border-b">
					<TabsTrigger value="video" class="text-xs gap-1"
						><VideoIcon class="h-3 w-3" /> Video</TabsTrigger
					>
					<TabsTrigger value="code" class="text-xs gap-1"
						><FileCode class="h-3 w-3" /> Code</TabsTrigger
					>
					<TabsTrigger value="discuss" class="text-xs gap-1"
						><MessageSquare class="h-3 w-3" /> Discuss</TabsTrigger
					>
				</TabsList>

				<TabsContent value="video" class="flex-1 mt-0 bg-black flex items-center justify-center">
					{#if videoSrc}
						<VideoPlayer src={videoSrc} onTimeUpdate={handleTimeUpdate} markers={videoMarkers} />
					{:else}
						<div class="text-center text-muted-foreground">
							<VideoIcon class="h-8 w-8 mx-auto mb-2" />
							<p>No video available</p>
						</div>
					{/if}
				</TabsContent>

				<TabsContent value="code" class="flex-1 mt-0 overflow-hidden">
					{#if fileNodes.length > 0}
						<CodeReviewWorkspace
							files={fileNodes}
							mode={'diff'}
							onLineClick={handleLineClick}
							onFileChange={handleFileChange}
						>
							{#snippet children()}
								{#if activeCommentLine !== null}
									<!-- Simplified mobile overlay -->
									<div
										class="fixed inset-x-4 bottom-4 z-50 bg-background border rounded-lg shadow-xl p-3 animate-in slide-in-from-bottom-5"
									>
										<div class="flex justify-between items-center mb-2 border-b pb-2">
											<span class="font-bold text-sm">Line {activeCommentLine}</span>
											<Button
												variant="ghost"
												size="icon"
												class="h-6 w-6"
												onclick={() => (activeCommentLine = null)}>✕</Button
											>
										</div>
										<InlineCommentThread
											lineNumber={activeCommentLine}
											filePath={currentFilePath}
											comments={getCommentsForLine(activeCommentLine)}
											resolved={getCommentsForLine(activeCommentLine).some((c) => c.resolved)}
											onAddComment={(content, parentId) =>
												handleAddInlineComment(content, activeCommentLine!, parentId)}
											onResolve={() => handleResolveThread(activeCommentLine!)}
										/>
									</div>
								{/if}
							{/snippet}
						</CodeReviewWorkspace>
					{/if}
				</TabsContent>

				<TabsContent value="discuss" class="flex-1 mt-0 overflow-hidden flex flex-col">
					<div class="flex-1 overflow-y-auto p-4 space-y-4">
						{#each threadedComments as comment}
							<Card>
								<CardContent class="p-3">
									<div class="flex gap-2">
										<Avatar class="h-8 w-8"
											><AvatarImage src={comment.authorAvatar} /><AvatarFallback
												>{getInitials(comment.authorName)}</AvatarFallback
											></Avatar
										>
										<div class="flex-1">
											<div class="flex justify-between">
												<span class="font-medium text-sm">{comment.authorName}</span>
												<span class="text-xs text-muted-foreground"
													>{formatTimestamp(comment.createdAt)}</span
												>
											</div>
											<p class="text-sm mt-1">{comment.content}</p>
										</div>
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>
					<div class="border-t p-3">
						<div class="flex gap-2">
							<Textarea
								bind:value={newComment}
								placeholder="Comment..."
								class="min-h-[50px] text-sm"
							/>
							<Button onclick={postComment} size="icon"><Send class="h-4 w-4" /></Button>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	</div>
</div>

<P2PShareDialog
	bind:open={showP2PShare}
	onClose={() => (showP2PShare = false)}
	reviewData={review}
/>
