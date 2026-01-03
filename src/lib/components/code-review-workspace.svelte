<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import CodeEditor from './code-editor.svelte';
	import DiffViewer from './diff-viewer.svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import File from '@lucide/svelte/icons/file';
	import FileCode from '@lucide/svelte/icons/file-code';
	import FileText from '@lucide/svelte/icons/file-text';
	import Folder from '@lucide/svelte/icons/folder';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
	import PanelLeft from '@lucide/svelte/icons/panel-left';
	import CheckSquare from '@lucide/svelte/icons/check-square';
	import Bot from '@lucide/svelte/icons/bot';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Menu from '@lucide/svelte/icons/menu';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import { LanguageDetector } from '$lib/utils/language-detector';
	import { toast } from 'svelte-sonner';

	export interface FileNode {
		name: string;
		path: string;
		type: 'file' | 'directory';
		content?: string;
		diff?: string;
		language?: string;
		status?: 'added' | 'modified' | 'deleted' | 'renamed';
		additions?: number;
		deletions?: number;
		children?: FileNode[];
	}

	interface Props {
		files: FileNode[];
		mode?: 'view' | 'diff';
		importSource?: string;
		aiAnalysis?: any;
		checklist?: {
			items: Record<string, boolean>;
			notes: Record<string, string>;
			template: string;
		};
		onFileChange?: (file: FileNode) => void;
		onBack?: () => void;
		onLineClick?: (line: number) => void;
		onChecklistChange?: (items: Record<string, boolean>) => void;
		onRunAI?: () => void;
		onAutoCheck?: () => void;
		children?: import('svelte').Snippet;
	}

	let {
		files = [],
		mode = 'diff',
		importSource = '',
		aiAnalysis = null,
		checklist = null,
		onFileChange,
		onBack,
		onLineClick,
		onChecklistChange,
		onRunAI,
		onAutoCheck,
		children,
		activeFilePath
	}: Props = $props();

	// State
	let sidebarOpen = $state(true);
	let sidebarWidth = $state(280);
	let activeSidebarTab = $state<'files' | 'ai' | 'checklist'>('files');
	let mobileDrawerOpen = $state(false);
	let searchQuery = $state('');
	let expandedDirs = $state<Set<string>>(new Set());
	let openTabs = $state<FileNode[]>([]);
	let activeTab = $state<FileNode | null>(null);
	let isDragging = $state(false);
	let explainDialogOpen = $state(false);
	let explainLoading = $state(false);
	let explainContent = $state('');
	let explainCode = $state('');
	let explainLineNumber = $state(0);

	const languageDetector = new LanguageDetector();

	// Helper function to navigate to a line in the first file
	function navigateToLine(lineNumber: number) {
		const file = files.find((f) => f.type === 'file');
		if (file) {
			openFile(file);
			onLineClick?.(lineNumber);
		}
	}

	// Handler for AI code explanation
	async function handleExplainCode(lineNumber: number, code: string) {
		explainLineNumber = lineNumber;
		explainCode = code;
		explainDialogOpen = true;
		explainLoading = true;
		explainContent = '';

		try {
			const language = activeTab?.language || 'javascript';
			const response = await fetch('/api/ai/explain', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					code: code.trim(),
					language
				})
			});

			if (!response.ok) {
				throw new Error('Failed to get explanation');
			}

			const data = await response.json();
			explainContent = data.explanation || 'No explanation available';
		} catch (error) {
			console.error('Error explaining code:', error);
			toast.error('Failed to explain code. Please try again.');
			explainContent = 'Failed to load explanation. Please try again.';
		} finally {
			explainLoading = false;
		}
	}

	// Build tree structure from flat file list
	const fileTree = $derived(() => {
		const tree: FileNode[] = [];
		const nodeMap = new Map<string, FileNode>();

		// Sort files by path
		const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

		for (const file of sortedFiles) {
			if (searchQuery && !file.path.toLowerCase().includes(searchQuery.toLowerCase())) {
				continue;
			}

			const parts = file.path.split('/');
			let currentPath = '';

			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];
				const isLast = i === parts.length - 1;
				currentPath = currentPath ? `${currentPath}/${part}` : part;

				if (!nodeMap.has(currentPath)) {
					const node: FileNode = {
						name: part,
						path: currentPath,
						type: isLast && file.type === 'file' ? 'file' : 'directory',
						children: []
					};

					if (isLast && file.type === 'file') {
						node.content = file.content;
						node.language = file.language || languageDetector.detectFromFilename(file.name);
						node.diff = file.diff;
						node.additions = file.additions;
						node.deletions = file.deletions;
						node.status = file.status;
					}

					nodeMap.set(currentPath, node);

					if (i === 0) {
						tree.push(node);
					} else {
						const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
						const parent = nodeMap.get(parentPath);
						if (parent && parent.children) {
							parent.children.push(node);
						}
					}
				}
			}
		}

		return tree;
	});

	// Stats
	const totalStats = $derived.by(() => {
		let additions = 0;
		let deletions = 0;

		for (const file of files) {
			additions += file.additions || 0;
			deletions += file.deletions || 0;
		}

		return { additions, deletions, files: files.filter((f) => f.type === 'file').length };
	});

	// Auto-select first file or respect activeFilePath
	$effect(() => {
		if (activeFilePath && activeFilePath !== activeTab?.path) {
			const found = files.find((f) => f.path === activeFilePath);
			if (found) openFile(found);
		} else if (!activeTab && files.length > 0 && !activeFilePath) {
			const firstFile = files.find((f) => f.type === 'file');
			if (firstFile) {
				openFile(firstFile);
			}
		}
	});

	// Expand parent directories by default
	$effect(() => {
		const dirs = new Set<string>();
		for (const file of files) {
			const parts = file.path.split('/');
			let path = '';
			for (let i = 0; i < parts.length - 1; i++) {
				path = path ? `${path}/${parts[i]}` : parts[i];
				dirs.add(path);
			}
		}
		expandedDirs = dirs;
	});

	function toggleDirectory(path: string) {
		if (expandedDirs.has(path)) {
			expandedDirs.delete(path);
		} else {
			expandedDirs.add(path);
		}
		expandedDirs = new Set(expandedDirs);
	}

	function openFile(file: FileNode) {
		if (file.type !== 'file') return;

		// Add to tabs if not already open
		if (!openTabs.find((t) => t.path === file.path)) {
			openTabs = [...openTabs, file];
		}

		activeTab = file;
		onFileChange?.(file);
		mobileDrawerOpen = false;
	}

	function closeTab(file: FileNode, e?: Event) {
		e?.stopPropagation();
		openTabs = openTabs.filter((t) => t.path !== file.path);

		if (activeTab?.path === file.path) {
			activeTab = openTabs[openTabs.length - 1] || null;
		}
	}

	function getFileIcon(filename: string, status?: string) {
		const ext = filename.split('.').pop()?.toLowerCase();

		// Status-based colors
		const statusColors: Record<string, string> = {
			added: 'text-green-500',
			modified: 'text-yellow-500',
			deleted: 'text-red-500',
			renamed: 'text-blue-500'
		};
		const statusColor = status ? statusColors[status] : '';

		// Extension-based colors (fallback)
		const extColors: Record<string, string> = {
			js: 'text-yellow-500',
			jsx: 'text-yellow-500',
			ts: 'text-blue-500',
			tsx: 'text-blue-500',
			py: 'text-green-500',
			go: 'text-cyan-500',
			rs: 'text-orange-500',
			svelte: 'text-orange-500',
			vue: 'text-green-500',
			css: 'text-purple-500',
			html: 'text-orange-500'
		};

		const color = statusColor || extColors[ext || ''] || 'text-muted-foreground';

		if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'svelte', 'vue'].includes(ext || '')) {
			return { component: FileCode, class: `h-4 w-4 ${color}` };
		}

		return { component: File, class: `h-4 w-4 ${color}` };
	}

	function handleResizeStart(e: MouseEvent) {
		isDragging = true;
		const startX = e.clientX;
		const startWidth = sidebarWidth;

		function onMouseMove(e: MouseEvent) {
			const delta = e.clientX - startX;
			sidebarWidth = Math.max(200, Math.min(500, startWidth + delta));
		}

		function onMouseUp() {
			isDragging = false;
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		}

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	// Keyboard shortcuts
	function handleKeydown(e: KeyboardEvent) {
		// Toggle sidebar with [
		if (e.key === '[' && !e.ctrlKey && !e.metaKey) {
			sidebarOpen = !sidebarOpen;
			e.preventDefault();
		}

		// Navigate files with j/k
		if ((e.key === 'j' || e.key === 'k') && !e.ctrlKey && !e.metaKey) {
			const fileList = files.filter((f) => f.type === 'file');
			const currentIndex = activeTab ? fileList.findIndex((f) => f.path === activeTab.path) : -1;

			if (e.key === 'j' && currentIndex < fileList.length - 1) {
				openFile(fileList[currentIndex + 1]);
			} else if (e.key === 'k' && currentIndex > 0) {
				openFile(fileList[currentIndex - 1]);
			}
			e.preventDefault();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="flex h-full w-full overflow-hidden bg-background">
	<!-- Mobile Overlay -->
	{#if mobileDrawerOpen}
		<button
			class="fixed inset-0 bg-black/50 z-40 lg:hidden"
			onclick={() => (mobileDrawerOpen = false)}
			aria-label="Close sidebar"
		></button>
	{/if}

	<!-- Sidebar -->
	<aside
		class="flex flex-col border-r bg-muted/30 transition-all duration-200 {mobileDrawerOpen
			? 'fixed inset-y-0 left-0 z-50 w-80'
			: 'hidden lg:flex'} {sidebarOpen ? '' : 'lg:w-0 lg:overflow-hidden'}"
		style={sidebarOpen ? `width: ${sidebarWidth}px` : ''}
	>
			<!-- Sidebar Tabs/Header -->
			<div class="flex items-center justify-between border-b p-2 bg-muted/50">
				<div class="flex items-center gap-1 rounded-lg bg-background border p-1">
					<Button
						variant={activeSidebarTab === 'files' ? 'secondary' : 'ghost'}
						size="sm"
						class="h-7 w-7 px-0"
						title="Files"
						onclick={() => (activeSidebarTab = 'files')}
					>
						<Folder class="h-4 w-4" />
					</Button>
					<Button
						variant={activeSidebarTab === 'ai' ? 'secondary' : 'ghost'}
						size="sm"
						class="h-7 w-7 px-0"
						title="AI Analysis"
						onclick={() => (activeSidebarTab = 'ai')}
					>
						<Bot class="h-4 w-4" />
					</Button>
					<Button
						variant={activeSidebarTab === 'checklist' ? 'secondary' : 'ghost'}
						size="sm"
						class="h-7 w-7 px-0"
						title="Checklist"
						onclick={() => (activeSidebarTab = 'checklist')}
					>
						<CheckSquare class="h-4 w-4" />
					</Button>
				</div>

				<div class="flex items-center gap-2">
					{#if activeSidebarTab === 'files'}
						<Badge variant="secondary" class="text-xs">
							{totalStats.files}
						</Badge>
					{/if}
					<Button
						variant="ghost"
						size="icon"
						class="h-7 w-7 lg:hidden"
						onclick={() => (mobileDrawerOpen = false)}
					>
						<X class="h-4 w-4" />
					</Button>
				</div>
			</div>

			<!-- FILES PANEL -->
			{#if activeSidebarTab === 'files'}
				<!-- Stats -->
				{#if mode === 'diff'}
					<div class="flex items-center gap-2 border-b px-3 py-2 text-xs">
						<Badge variant="outline" class="text-green-600">+{totalStats.additions}</Badge>
						<Badge variant="outline" class="text-red-600">-{totalStats.deletions}</Badge>
						{#if importSource}
							<span class="ml-auto text-muted-foreground truncate">{importSource}</span>
						{/if}
					</div>
				{/if}

				<!-- Search -->
				<div class="border-b p-2">
					<div class="relative">
						<Search
							class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							placeholder="Filter files..."
							bind:value={searchQuery}
							class="h-8 pl-8 text-sm"
						/>
					</div>
				</div>

				<!-- File Tree -->
				<ScrollArea class="flex-1">
					<div class="p-2">
						{#each fileTree() as node (node.path)}
							{@render FileTreeNode(node, 0)}
						{/each}
					</div>
				</ScrollArea>
			{:else if activeSidebarTab === 'ai'}
				<!-- AI PANEL -->
				<ScrollArea class="flex-1">
					<div class="p-4 space-y-4">
						{#if aiAnalysis}
							<div class="space-y-4">
								<!-- Summary -->
								<div>
									<h4 class="font-semibold mb-2 flex items-center gap-2">
										<Sparkles class="h-4 w-4 text-primary" />
										Summary
									</h4>
									<p class="text-sm text-muted-foreground">{aiAnalysis.summary}</p>
								</div>

								<!-- Bugs -->
								{#if aiAnalysis.bugs?.length > 0}
									<div>
										<h4 class="font-semibold mb-2 text-destructive flex items-center gap-2">
											<span>Bugs</span>
											<Badge variant="destructive" class="text-xs">{aiAnalysis.bugs.length}</Badge>
										</h4>
										<div class="space-y-2">
											{#each aiAnalysis.bugs as bug}
												<button
													type="button"
													class="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
													onclick={() => bug.line && navigateToLine(bug.line)}
												>
													<div class="flex items-start gap-2">
														<Badge
															variant={bug.severity === 'critical' || bug.severity === 'high'
																? 'destructive'
																: 'outline'}
															class="text-xs shrink-0"
														>
															{bug.severity}
														</Badge>
														<div class="flex-1 min-w-0">
															<p class="text-sm font-medium">{bug.type}</p>
															<p class="text-xs text-muted-foreground mt-1">{bug.description}</p>
															{#if bug.line}
																<p class="text-xs text-primary mt-1">Line {bug.line}</p>
															{/if}
														</div>
													</div>
												</button>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Security Issues -->
								{#if aiAnalysis.securityIssues?.length > 0}
									<div>
										<h4 class="font-semibold mb-2 text-orange-500 flex items-center gap-2">
											<span>Security Issues</span>
											<Badge variant="secondary" class="text-xs">{aiAnalysis.securityIssues.length}</Badge>
										</h4>
										<div class="space-y-2">
											{#each aiAnalysis.securityIssues as issue}
												<div class="p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
													<div class="flex items-start gap-2">
														<Badge
															variant={issue.severity === 'critical' || issue.severity === 'high'
																? 'destructive'
																: 'outline'}
															class="text-xs shrink-0"
														>
															{issue.severity}
														</Badge>
														<div class="flex-1 min-w-0">
															<p class="text-sm font-medium">{issue.type}</p>
															<p class="text-xs text-muted-foreground mt-1">{issue.description}</p>
															<p class="text-xs mt-1 font-medium">→ {issue.recommendation}</p>
														</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Suggestions -->
								{#if aiAnalysis.suggestions?.length > 0}
									<div>
										<h4 class="font-semibold mb-2 text-blue-500 flex items-center gap-2">
											<span>Suggestions</span>
											<Badge variant="secondary" class="text-xs">{aiAnalysis.suggestions.length}</Badge>
										</h4>
										<div class="space-y-2">
											{#each aiAnalysis.suggestions as suggestion}
												<button
													type="button"
													class="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
													onclick={() => suggestion.line && navigateToLine(suggestion.line)}
												>
													<div class="flex items-start gap-2">
														<Badge variant="outline" class="text-xs shrink-0 capitalize">
															{suggestion.type}
														</Badge>
														<div class="flex-1 min-w-0">
															<p class="text-sm font-medium">{suggestion.description}</p>
															{#if suggestion.line}
																<p class="text-xs text-primary mt-1">Line {suggestion.line}</p>
															{/if}
															<Badge variant="secondary" class="text-xs mt-1">{suggestion.impact} impact</Badge>
														</div>
													</div>
												</button>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Performance Notes -->
								{#if aiAnalysis.performanceNotes?.length > 0}
									<div>
										<h4 class="font-semibold mb-2 text-amber-500 flex items-center gap-2">
											<span>Performance</span>
											<Badge variant="secondary" class="text-xs">{aiAnalysis.performanceNotes.length}</Badge>
										</h4>
										<div class="space-y-2">
											{#each aiAnalysis.performanceNotes as note}
												<div class="p-3 rounded-lg border">
													<div class="flex items-start gap-2">
														<Badge variant="outline" class="text-xs shrink-0">
															{note.impact}
														</Badge>
														<div class="flex-1 min-w-0">
															<p class="text-sm">{note.description}</p>
															<p class="text-xs text-muted-foreground mt-1">→ {note.recommendation}</p>
														</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Code Smells -->
								{#if aiAnalysis.codeSmells?.length > 0}
									<div>
										<h4 class="font-semibold mb-2 flex items-center gap-2">
											<span>Code Smells</span>
											<Badge variant="secondary" class="text-xs">{aiAnalysis.codeSmells.length}</Badge>
										</h4>
										<div class="space-y-2">
											{#each aiAnalysis.codeSmells as smell}
												<button
													type="button"
													class="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
													onclick={() => smell.line && navigateToLine(smell.line)}
												>
													<div class="flex-1 min-w-0">
														<p class="text-sm font-medium">{smell.type}</p>
														<p class="text-xs text-muted-foreground mt-1">{smell.description}</p>
														{#if smell.line}
															<p class="text-xs text-primary mt-1">Line {smell.line}</p>
														{/if}
													</div>
												</button>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Overall Score -->
								{#if aiAnalysis.overallScore !== undefined}
									<div class="pt-4 border-t">
										<div class="flex items-center justify-between">
											<span class="text-sm font-medium">Overall Score</span>
											<Badge
												variant={aiAnalysis.overallScore >= 80
													? 'default'
													: aiAnalysis.overallScore >= 60
														? 'secondary'
														: 'destructive'}
												class="text-lg px-3 py-1"
											>
												{aiAnalysis.overallScore}/100
											</Badge>
										</div>
									</div>
								{/if}
							</div>
						{:else}
							<div class="text-center py-8 text-muted-foreground">
								<Bot class="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p>No AI analysis available yet.</p>
								{#if onRunAI}
									<Button variant="outline" size="sm" class="mt-4" onclick={onRunAI}>
										<Sparkles class="h-4 w-4 mr-2" />
										Run Analysis
									</Button>
								{/if}
							</div>
						{/if}
					</div>
				</ScrollArea>
			{:else if activeSidebarTab === 'checklist'}
				<!-- CHECKLIST PANEL -->
				<ScrollArea class="flex-1">
					<div class="p-4">
						{#if checklist}
							<div class="space-y-4">
								<div class="flex items-center justify-between">
									<h4 class="font-semibold">Review Checklist</h4>
									<Badge variant="outline" class="text-xs">
										{Object.values(checklist.items).filter(Boolean).length}/{Object.keys(
											checklist.items
										).length}
									</Badge>
								</div>

								{#if onAutoCheck}
									<Button variant="outline" size="sm" class="w-full mb-4" onclick={onAutoCheck}>
										<Bot class="h-4 w-4 mr-2" />
										Auto-check with AI
									</Button>
								{/if}

								<div class="space-y-2">
									{#each Object.keys(checklist.items) as item}
										<div
											class="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border transition-colors"
										>
											<input
												type="checkbox"
												id={item}
												checked={checklist.items[item]}
												onchange={(e) => {
													const newItems = { ...checklist?.items, [item]: e.currentTarget.checked };
													onChecklistChange?.(newItems);
												}}
												class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
											/>
											<div class="space-y-1">
												<label
													for={item}
													class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
												>
													{item}
												</label>
												{#if checklist.notes?.[item]}
													<p class="text-xs text-muted-foreground bg-muted/50 p-1.5 rounded">
														<Bot class="h-3 w-3 inline mr-1 text-primary" />
														{checklist.notes[item]}
													</p>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<div class="text-center py-8 text-muted-foreground">
								<CheckSquare class="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p>No checklist available.</p>
							</div>
						{/if}
					</div>
				</ScrollArea>
			{/if}

			<!-- Keyboard Hints -->
			<div class="border-t p-2 text-xs text-muted-foreground">
				<div class="flex items-center justify-between">
					<span>j/k navigate</span>
					<span>[ toggle sidebar</span>
				</div>
			</div>

			<!-- Resize Handle -->
			<button
				class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors {isDragging
					? 'bg-primary/30'
					: ''}"
				onmousedown={handleResizeStart}
				aria-label="Resize sidebar"
			></button>
		</aside>

		<!-- Main Content -->
		<main class="flex flex-1 flex-col overflow-hidden">
			<!-- Header Bar -->
			<div class="flex items-center gap-2 border-b px-2 py-1.5 bg-muted/20">
				<!-- Mobile Menu Button -->
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 lg:hidden"
					onclick={() => (mobileDrawerOpen = true)}
				>
					<Menu class="h-4 w-4" />
				</Button>

				<!-- Sidebar Toggle (Desktop) -->
				<Button
					variant="ghost"
					size="icon"
					class="hidden lg:flex h-8 w-8"
					onclick={() => (sidebarOpen = !sidebarOpen)}
					title="Toggle sidebar ([)"
				>
					{#if sidebarOpen}
						<PanelLeftClose class="h-4 w-4" />
					{:else}
						<PanelLeft class="h-4 w-4" />
					{/if}
				</Button>

				<!-- Back Button -->
				{#if onBack}
					<Button variant="ghost" size="sm" onclick={onBack} class="gap-1">
						<ChevronLeft class="h-4 w-4" />
						<span class="hidden sm:inline">Back to Editor</span>
					</Button>
					<Separator orientation="vertical" class="h-6" />
				{/if}

				<!-- File Tabs -->
				<div class="flex-1 overflow-x-auto">
					<div class="flex items-center gap-1">
						{#each openTabs as tab (tab.path)}
							{@const icon = getFileIcon(tab.name, tab.status)}
							<div
								class="group flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors {activeTab?.path ===
								tab.path
									? 'bg-background border shadow-sm'
									: 'hover:bg-muted'}"
							>
								<button onclick={() => (activeTab = tab)} class="flex items-center gap-1.5 min-w-0">
									<icon.component class={icon.class} />
									<span class="max-w-32 truncate">{tab.name}</span>
									{#if tab.additions || tab.deletions}
										<span class="flex items-center gap-0.5 text-xs">
											{#if tab.additions}<span class="text-green-600">+{tab.additions}</span>{/if}
											{#if tab.deletions}<span class="text-red-600">-{tab.deletions}</span>{/if}
										</span>
									{/if}
								</button>
								<button
									onclick={(e) => closeTab(tab, e)}
									class="ml-1 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 flex-shrink-0"
								>
									<X class="h-3 w-3" />
								</button>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- File Content -->
			<div class="flex-1 overflow-auto">
				{#if activeTab}
					<div class="h-full">
						{#if mode === 'diff' && activeTab.diff}
							<div class="p-4">
								<DiffViewer diff={activeTab.diff} filename={activeTab.path} {onLineClick} {aiAnalysis} onExplainCode={handleExplainCode} />
							</div>
						{:else if activeTab.content}
							<CodeEditor
								value={activeTab.content}
								language={activeTab.language || 'text'}
								readonly
								showLineNumbers
								class="h-full"
							/>
						{:else}
							<div class="flex h-full items-center justify-center text-muted-foreground">
								<div class="text-center">
									<FileText class="mx-auto h-12 w-12 opacity-20" />
									<p class="mt-4">No content available</p>
								</div>
							</div>
						{/if}
					</div>
					{@render children?.()}
				{:else}
					<div class="flex h-full items-center justify-center text-muted-foreground">
						<div class="text-center">
							<Folder class="mx-auto h-12 w-12 opacity-20" />
							<p class="mt-4">Select a file to view</p>
							<p class="text-sm mt-1">Use the file tree on the left or press j/k to navigate</p>
						</div>
					</div>
				{/if}
			</div>
		</main>
</div>

<!-- Recursive File Tree Node Snippet -->
{#snippet FileTreeNode(node: FileNode, depth: number)}
	{#if node.type === 'directory'}
		<div class="file-tree-directory">
			<button
				onclick={() => toggleDirectory(node.path)}
				class="flex w-full items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent transition-colors"
				style="padding-left: {depth * 12 + 8}px"
			>
				{#if expandedDirs.has(node.path)}
					<ChevronDown class="h-4 w-4 flex-shrink-0" />
					<FolderOpen class="h-4 w-4 text-muted-foreground flex-shrink-0" />
				{:else}
					<ChevronRight class="h-4 w-4 flex-shrink-0" />
					<Folder class="h-4 w-4 text-muted-foreground flex-shrink-0" />
				{/if}
				<span class="truncate">{node.name}</span>
			</button>

			{#if expandedDirs.has(node.path) && node.children}
				{#each node.children as child (child.path)}
					{@render FileTreeNode(child, depth + 1)}
				{/each}
			{/if}
		</div>
	{:else}
		{@const icon = getFileIcon(node.name, node.status)}
		<button
			onclick={() => openFile(node)}
			class="flex w-full items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent transition-colors {activeTab?.path ===
			node.path
				? 'bg-accent'
				: ''}"
			style="padding-left: {depth * 12 + 28}px"
		>
			<icon.component class={icon.class} />
			<span class="flex-1 truncate text-left">{node.name}</span>
			{#if node.additions || node.deletions}
				<span class="flex items-center gap-1 text-xs">
					{#if node.additions > 0}
						<span class="text-green-600">+{node.additions}</span>
					{/if}
					{#if node.deletions > 0}
						<span class="text-red-600">-{node.deletions}</span>
					{/if}
				</span>
			{/if}
		</button>
	{/if}
{/snippet}

<!-- AI Code Explanation Dialog -->
<Dialog bind:open={explainDialogOpen}>
	<DialogContent class="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<Sparkles class="h-5 w-5 text-purple-600" />
				AI Code Explanation
				{#if explainLineNumber > 0}
					<Badge variant="outline">Line {explainLineNumber}</Badge>
				{/if}
			</DialogTitle>
			<DialogDescription>
				Understanding the selected code
			</DialogDescription>
		</DialogHeader>
		
		<div class="flex-1 overflow-auto space-y-4">
			<!-- Original Code -->
			<div class="space-y-2">
				<h4 class="text-sm font-semibold">Code:</h4>
				<pre class="p-3 bg-muted rounded-lg text-xs overflow-x-auto"><code>{explainCode}</code></pre>
			</div>
			
			<!-- Explanation -->
			<div class="space-y-2">
				<h4 class="text-sm font-semibold">Explanation:</h4>
				{#if explainLoading}
					<div class="flex items-center justify-center p-8">
						<Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
						<span class="ml-2 text-sm text-muted-foreground">Analyzing code...</span>
					</div>
				{:else}
					<div class="prose prose-sm max-w-none p-3 bg-muted/50 rounded-lg">
						{@html explainContent.replace(/\n/g, '<br>')}
					</div>
				{/if}
			</div>
		</div>
		
		<div class="flex justify-end gap-2 pt-4 border-t">
			<Button variant="outline" onclick={() => explainDialogOpen = false}>Close</Button>
		</div>
	</DialogContent>
</Dialog>

<style>
	.file-tree-directory {
		/* Ensure proper indentation */
	}
</style>
