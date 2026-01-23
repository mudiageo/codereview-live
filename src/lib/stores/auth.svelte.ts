import { goto } from '$app/navigation';
import { authClient } from '$lib/auth-client';
import type { User } from 'better-auth';
import { toast } from 'svelte-sonner';

class AuthState {
	currentUser = $state<User | null>(null);
	isAuthenticated = $derived(!!this.currentUser);
	userPlan = $derived(this.currentUser?.plan || 'free');

	constructor() {
		// Initialize auth state
		if (typeof window !== 'undefined') {
			authClient.getSession().then((session) => {
				if (session.data?.user) {
					this.currentUser = session.data.user;
				}
			});
		}
	}

	async signIn(email: string, password: string, rememberMe = false) {
		const result = await authClient.signIn.email(
			{
				email,
				password,
				callbackURL: '/dashboard',
				rememberMe
			},
			{
				onSuccess: (ctx) => {
					this.currentUser = ctx.data.user;
				},
				onError: (ctx) => {
					// Handle the error
					if (ctx.error.status === 403) {
						toast('Please verify your email address');
					}

					toast(ctx.error.message);
				}
			}
		);

		if (result.data?.user) {
			this.currentUser = result.data.user;
		}

		return result;
	}

	async signUp(data: any) {
		const result = await authClient.signUp.email(
			{
				...data,
				callbackURL: '/onboarding'
			},
			{
				onSuccess: (ctx) => {
					this.currentUser = ctx.data.user;
				}
			}
		);

		if (result.data?.user) {
			this.currentUser = result.data.user;
		}

		return result;
	}

	async signOut() {
		await authClient.signOut();
		this.currentUser = null;
		goto('/login');
	}

	async signInWithProvider(provider: 'google' | 'github') {
		await authClient.signIn.social({
			provider,
			callbackURL: '/dashboard',
			newUserCallbackURL: '/onboarding'
		});
	}
}

export const auth = new AuthState();
