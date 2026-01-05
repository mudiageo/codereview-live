<script lang="ts">
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import { settingsStore } from '$lib/stores/index.svelte';

	interface Props {
		value?: string;
		language?: string;
		readonly?: boolean;
		showLineNumbers?: boolean;
		class?: string;
		onscroll?: (e: Event) => void;
	}

	let {
		value = $bindable(''),
		language = 'javascript',
		readonly = false,
		showLineNumbers,
		class: className = '',
		onscroll
	}: Props = $props();
	
	// Use settings for line numbers if not explicitly provided
	const shouldShowLineNumbers = $derived(showLineNumbers ?? settingsStore.settings.lineNumbers);
	const wordWrap = $derived(settingsStore.settings.wordWrap);
	const tabSize = $derived(settingsStore.settings.tabSize);

	let copied = $state(false);
	let containerRef = $state<HTMLDivElement>();
	let textareaRef = $state<HTMLTextAreaElement>(null);

	export function scrollTo(top: number) {
		if (containerRef) {
			containerRef.scrollTop = top;
		}
		if (textareaRef) {
			textareaRef.scrollTop = top;
		}
	}

	const lines = $derived(value.split('\n'));

	async function copyToClipboard() {
		await navigator.clipboard.writeText(value);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div class="relative rounded-lg border bg-code-bg {className}">
	<!-- Header -->
	<div class="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
		<Badge variant="secondary" class="text-xs font-mono">
			{language}
		</Badge>

		<Button variant="ghost" size="sm" class="h-7 gap-2" onclick={copyToClipboard}>
			{#if copied}
				<Check class="h-3 w-3" />
				Copied
			{:else}
				<Copy class="h-3 w-3" />
				Copy
			{/if}
		</Button>
	</div>

	<!-- Editor -->
	<div class="flex">
		{#if shouldShowLineNumbers}
			<div
				class="select-none border-r bg-muted/20 px-4 py-4 text-right font-mono text-sm text-muted-foreground"
			>
				{#each lines as _, i}
					<div class="leading-6">{i + 1}</div>
				{/each}
			</div>
		{/if}

		<div
			bind:this={containerRef}
			class="flex-1 overflow-x-auto"
			onscroll={readonly ? onscroll : undefined}
		>
			{#if readonly}
				<pre class="p-4 font-mono leading-6" style="font-size: var(--editor-font-size); white-space: {wordWrap === 'off' ? 'pre' : 'pre-wrap'}; tab-size: {tabSize};"><code>{value}</code></pre>
			{:else}
				<Textarea
					bind:ref={textareaRef}
					bind:value
					class="min-h-[400px] resize-none border-0 bg-transparent font-mono focus-visible:ring-0"
					style="font-size: var(--editor-font-size); line-height: 1.5; white-space: {wordWrap === 'off' ? 'pre' : 'pre-wrap'}; tab-size: {tabSize};"
					placeholder="Paste your code here..."
					{onscroll}
				/>
			{/if}
		</div>
	</div>
</div>
