<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Slider } from '$lib/components/ui/slider';
	import Pen from '@lucide/svelte/icons/pen';
	import Highlighter from '@lucide/svelte/icons/highlighter';
	import Square from '@lucide/svelte/icons/square';
	import Circle from '@lucide/svelte/icons/circle-dot';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Type from '@lucide/svelte/icons/type';
	import Undo from '@lucide/svelte/icons/undo';
	import Redo from '@lucide/svelte/icons/redo';
	import Trash from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';

	interface Props {
		onToolChange: (tool: AnnotationTool) => void;
		onUndo: () => void;
		onRedo: () => void;
		onClear: () => void;
		onToggleVisibility: () => void;
		currentTool: AnnotationTool;
		canUndo: boolean;
		canRedo: boolean;
		visible: boolean;
	}

	export interface AnnotationTool {
		type: 'pen' | 'highlighter' | 'arrow' | 'rectangle' | 'circle' | 'text';
		color: string;
		strokeWidth: number;
	}

	let {
		onToolChange,
		onUndo,
		onRedo,
		onClear,
		onToggleVisibility,
		currentTool,
		canUndo,
		canRedo,
		visible
	}: Props = $props();

	const presetColors = [
		'#ff0000',
		'#00ff00',
		'#0000ff',
		'#ffff00',
		'#ff00ff',
		'#00ffff',
		'#000000',
		'#ffffff',
		'#ff6600',
		'#9933ff'
	];

	function handleToolSelect(type: AnnotationTool['type']) {
		onToolChange({ ...currentTool, type });
	}

	function handleColorSelect(color: string) {
		onToolChange({ ...currentTool, color });
	}

	function handleStrokeWidthChange(value: number[]) {
		onToolChange({ ...currentTool, strokeWidth: value[0] });
	}
</script>

<div
	class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-2 flex items-center gap-2"
>
	<!-- Tool Selection -->
	<div class="flex gap-1 border-r pr-2">
		<Button
			size="icon"
			variant={currentTool.type === 'pen' ? 'default' : 'ghost'}
			onclick={() => handleToolSelect('pen')}
		>
			<Pen class="h-4 w-4" />
		</Button>

		<Button
			size="icon"
			variant={currentTool.type === 'highlighter' ? 'default' : 'ghost'}
			onclick={() => handleToolSelect('highlighter')}
		>
			<Highlighter class="h-4 w-4" />
		</Button>

		<Button
			size="icon"
			variant={currentTool.type === 'arrow' ? 'default' : 'ghost'}
			onclick={() => handleToolSelect('arrow')}
		>
			<ArrowRight class="h-4 w-4" />
		</Button>

		<Button
			size="icon"
			variant={currentTool.type === 'rectangle' ? 'default' : 'ghost'}
			onclick={() => handleToolSelect('rectangle')}
		>
			<Square class="h-4 w-4" />
		</Button>

		<Button
			size="icon"
			variant={currentTool.type === 'circle' ? 'default' : 'ghost'}
			onclick={() => handleToolSelect('circle')}
		>
			<Circle class="h-4 w-4" />
		</Button>

		<Button
			size="icon"
			variant={currentTool.type === 'text' ? 'default' : 'ghost'}
			onclick={() => handleToolSelect('text')}
		>
			<Type class="h-4 w-4" />
		</Button>
	</div>

	<!-- Color Picker -->
	<Popover>
		<PopoverTrigger>
			{#snippet child(props)}
				<Button {...props} size="icon" variant="outline">
					<div class="w-4 h-4 rounded border" style="background-color: {currentTool.color}" />
				</Button>
			{/snippet}
		</PopoverTrigger>
		<PopoverContent class="w-48">
			<div class="grid grid-cols-5 gap-2">
				{#each presetColors as color}
					<button
						class="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
						class:ring-2={currentTool.color === color}
						class:ring-primary={currentTool.color === color}
						style="background-color: {color}"
						onclick={() => handleColorSelect(color)}
					/>
				{/each}
			</div>
		</PopoverContent>
	</Popover>

	<!-- Stroke Width -->
	<Popover>
		<PopoverTrigger>
			{#snippet child(props)}
				<Button {...props} size="sm" variant="outline">
					{currentTool.strokeWidth}px
				</Button>
			{/snippet}
		</PopoverTrigger>
		<PopoverContent class="w-64">
			<div class="space-y-2">
				<label class="text-sm font-medium">Stroke Width</label>
				<Slider
					value={[currentTool.strokeWidth]}
					min={1}
					max={20}
					step={1}
					onValueChange={handleStrokeWidthChange}
				/>
			</div>
		</PopoverContent>
	</Popover>

	<!-- Actions -->
	<div class="flex gap-1 border-l pl-2">
		<Button size="icon" variant="ghost" disabled={!canUndo} onclick={onUndo} title="Undo (Ctrl+Z)">
			<Undo class="h-4 w-4" />
		</Button>

		<Button size="icon" variant="ghost" disabled={!canRedo} onclick={onRedo} title="Redo (Ctrl+Y)">
			<Redo class="h-4 w-4" />
		</Button>

		<Button size="icon" variant="ghost" onclick={onClear} title="Clear All">
			<Trash class="h-4 w-4" />
		</Button>

		<Button size="icon" variant="ghost" onclick={onToggleVisibility} title="Toggle Visibility">
			{#if visible}
				<Eye class="h-4 w-4" />
			{:else}
				<EyeOff class="h-4 w-4" />
			{/if}
		</Button>
	</div>
</div>
