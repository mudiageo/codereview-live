<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { toast } from 'svelte-sonner';
	import { projectsStore, subscriptionsStore } from '$lib/stores/index.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { hasFeatureAccess } from '$lib/config';

	let name = $state('');
	let description = $state('');
	let repoUrl = $state('');
	let color = $state('#8B5CF6');
	let isTeam = $state(false);
	let isSubmitting = $state(false);

	const userPlan = $derived(auth.currentUser?.plan || 'free');
	const canCreateTeam = $derived(hasFeatureAccess(userPlan as any, 'teamCollaboration'));

	async function handleSubmit() {
		if (!name.trim()) {
			toast.error('Project name is required');
			return;
		}

		if (!auth.currentUser) {
			toast.error('You must be logged in to create a project');
			return;
		}

		isSubmitting = true;

		try {
			const newProject = await projectsStore.create({
				name,
				description: description || null,
				repoUrl: repoUrl || null,
				color,
				isTeam: isTeam && canCreateTeam,
				userId: auth.currentUser.id
			});

			if (newProject) {
				toast.success('Project created successfully!');
				goto(`/projects/${newProject.id}`);
			}
		} catch (error) {
			console.error('Failed to create project:', error);
			toast.error('Failed to create project. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	const colors = [
		'#8B5CF6', // purple
		'#3B82F6', // blue
		'#10B981', // green
		'#F59E0B', // amber
		'#EF4444', // red
		'#EC4899', // pink
		'#6366F1', // indigo
		'#14B8A6' // teal
	];
</script>

<div class="container max-w-2xl py-8">
	<div class="mb-6">
		<Button variant="ghost" onclick={() => goto('/projects')} class="mb-4">
			<ArrowLeft class="h-4 w-4 mr-2" />
			Back to Projects
		</Button>
		<h1 class="text-3xl font-bold">Create New Project</h1>
		<p class="text-muted-foreground mt-2">
			Organize your code reviews by creating projects
		</p>
	</div>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="space-y-6"
	>
		<!-- Project Name -->
		<div class="space-y-2">
			<Label for="name">Project Name *</Label>
			<Input
				id="name"
				bind:value={name}
				placeholder="My Awesome Project"
				required
				disabled={isSubmitting}
			/>
		</div>

		<!-- Description -->
		<div class="space-y-2">
			<Label for="description">Description</Label>
			<Textarea
				id="description"
				bind:value={description}
				placeholder="Describe your project..."
				rows={4}
				disabled={isSubmitting}
			/>
		</div>

		<!-- Repository URL -->
		<div class="space-y-2">
			<Label for="repoUrl">Repository URL (optional)</Label>
			<Input
				id="repoUrl"
				bind:value={repoUrl}
				placeholder="https://github.com/username/repo"
				type="url"
				disabled={isSubmitting}
			/>
			<p class="text-sm text-muted-foreground">Link this project to a GitHub repository</p>
		</div>

		<!-- Color Picker -->
		<div class="space-y-2">
			<Label>Project Color</Label>
			<div class="flex gap-2 flex-wrap">
				{#each colors as colorOption}
					<button
						type="button"
						class="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110"
						style="background-color: {colorOption}; border-color: {color === colorOption
							? colorOption
							: 'transparent'}"
						class:ring-2={color === colorOption}
						class:ring-offset-2={color === colorOption}
						onclick={() => (color = colorOption)}
						disabled={isSubmitting}
					/>
				{/each}
			</div>
		</div>

		<!-- Team Toggle (if available) -->
		{#if canCreateTeam}
			<div class="flex items-center space-x-2">
				<input
					type="checkbox"
					id="isTeam"
					bind:checked={isTeam}
					disabled={isSubmitting}
					class="rounded"
				/>
				<Label for="isTeam" class="cursor-pointer">
					Team Project
					<span class="text-sm text-muted-foreground ml-2"> (Allows team collaboration) </span>
				</Label>
			</div>
		{:else}
			<div class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
				💡 Upgrade to Team plan to create team projects with collaboration features
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex gap-3 pt-4">
			<Button
				type="button"
				variant="outline"
				onclick={() => goto('/projects')}
				disabled={isSubmitting}
			>
				Cancel
			</Button>
			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Creating...' : 'Create Project'}
			</Button>
		</div>
	</form>
</div>

<style>
	button[type='button']:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
