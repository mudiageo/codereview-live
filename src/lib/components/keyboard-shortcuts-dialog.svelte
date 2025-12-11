<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { keyboardShortcuts, KeyboardShortcuts } from '$lib/utils/keyboard-shortcuts';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const shortcuts = $derived(keyboardShortcuts.getAll());
	const categories = $derived(keyboardShortcuts.getCategories());

	function getShortcutsByCategory(category: string) {
		return shortcuts.filter((s) => s.category === category);
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Keyboard Shortcuts</DialogTitle>
		</DialogHeader>

		<div class="space-y-6">
			{#each categories as category}
				<div class="space-y-3">
					<h3 class="text-lg font-semibold text-muted-foreground">{category}</h3>
					<div class="space-y-2">
						{#each getShortcutsByCategory(category) as shortcut}
							<div
								class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
							>
								<span class="text-sm">{shortcut.description}</span>
								<kbd
									class="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded"
								>
									{KeyboardShortcuts.formatKey(shortcut)}
								</kbd>
							</div>
						{/each}
					</div>
				</div>
			{/each}

			{#if categories.length === 0}
				<div class="text-center text-muted-foreground py-8">No shortcuts configured</div>
			{/if}
		</div>
	</DialogContent>
</Dialog>

<style>
	kbd {
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}
</style>
