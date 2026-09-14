<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '#lib/components/ui/select/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.js';
	import { Avatar, AvatarFallback, AvatarImage } from '#lib/components/ui/avatar/index.js';
	import Camera from '@lucide/svelte/icons/camera';
	import { goto } from '$app/navigation';
	import { authClient } from '#lib/auth-client.js';
	import { auth } from '#lib/stores/auth.svelte.js';
	import { toast } from 'svelte-sonner';

	let name = $state('');
	let role = $state('');
	let avatar = $state('');
	let loading = $state(false);
	let fileInput: HTMLInputElement;

	const roles = [
		'Frontend Developer',
		'Backend Developer',
		'Full Stack Developer',
		'Mobile Developer',
		'DevOps Engineer',
		'Tech Lead',
		'Engineering Manager',
		'Other'
	];

	const dots = [true, true, false];

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files?.length) return;

		const file = input.files[0];
		const formData = new FormData();
		formData.append('avatar', file);

		loading = true;
		try {
			const response = await fetch('/api/upload-avatar', {
				method: 'POST',
				body: formData
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error);
			avatar = result.url;
			toast.success('Avatar uploaded');
		} catch (err: any) {
			toast.error(err.message || 'Failed to upload avatar');
		} finally {
			loading = false;
		}
	}

	async function handleSubmit() {
		loading = true;
		try {
			await authClient.user.update({
				name,
				image: avatar
			});
			if (auth.currentUser) {
				auth.currentUser.name = name;
				auth.currentUser.image = avatar;
			}
			toast.success('Profile updated');
			goto('/onboarding/preferences');
		} catch (err: any) {
			toast.error(err.message || 'Failed to update profile');
		} finally {
			loading = false;
		}
	}
</script>

<div
	class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5"
>
	<Card class="w-full max-w-lg border-border/50 shadow-xl">
		<CardHeader class="text-center space-y-2">
			<CardTitle class="text-2xl font-bold">Set Up Your Profile</CardTitle>
			<CardDescription>Help your team recognize you</CardDescription>
		</CardHeader>

		<CardContent class="space-y-6">
			<!-- Avatar Upload -->
			<div class="flex flex-col items-center space-y-4">
				<div class="relative">
					<Avatar class="h-24 w-24">
						<AvatarImage src={avatar} />
						<AvatarFallback class="text-2xl">
							{name ? getInitials(name) : 'JD'}
						</AvatarFallback>
					</Avatar>
					<button
						type="button"
						onclick={() => fileInput.click()}
						class="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
					>
						<Camera class="h-4 w-4" />
					</button>
				</div>
				<Button variant="outline" size="sm" onclick={() => fileInput.click()}>Upload Photo</Button>
				<input
					type="file"
					accept="image/*"
					class="hidden"
					bind:this={fileInput}
					onchange={handleFileSelect}
				/>
			</div>

			<!-- Form Fields -->
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="name">Display Name</Label>
					<Input id="name" placeholder="John Doe" bind:value={name} required />
				</div>

				<div class="space-y-2">
					<Label for="role">Your Role</Label>
					<Select type="single" bind:value={role}>
						<SelectTrigger>
							{role || 'Select your role'}
						</SelectTrigger>
						<SelectContent>
							{#each roles as roleOption}
								<SelectItem type="single" value={roleOption}>{roleOption}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			</div>

			<!-- Progress Dots -->
			<div class="flex justify-center gap-2">
				{#each dots as active}
					<div class="h-2 w-2 rounded-full {active ? 'bg-primary' : 'bg-muted'}"></div>
				{/each}
			</div>
		</CardContent>

		<CardFooter class="flex justify-between">
			<Button variant="ghost" href="/onboarding">Back</Button>
			<Button onclick={handleSubmit} disabled={!name || !role || loading}>
				{loading ? 'Saving...' : 'Continue'}
			</Button>
		</CardFooter>
	</Card>
</div>
