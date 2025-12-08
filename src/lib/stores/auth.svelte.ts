import { writable, derived } from 'svelte/store';
import { authClient } from '$lib/auth.client';
import type { User } from 'better-auth';

export const currentUser = writable<User | null>(null);
class AuthState {
  currentUser: User | null = $state(null)
  isAuthenticated: boolean = $state(this.currentUser !== null)
  userPlan: boolean = $state(this.currentUser?.plan  || 'free')
}
export const auth = new AuthState()
export const isAuthenticated = $derived(auth.isAuthenticated);

export const userPlan = $derived(auth.userPlan);

// Initialize auth state
if (typeof window !== 'undefined') {
  authClient.session().then((session) => {
    if (session?.user) {
      auth.currentUser = session.user;
    }
  });
}

// Helper functions
export async function signIn(email: string, password: string, rememberMe = false) {
  const result = await authClient.signIn.email({
    email,
    password,
    callbackURL: '/dashboard',
    rememberMe,
  });
  
  if (result.user) {
    auth.currentUser = result.user;
  }
  
  return result;
}

export async function signUp(data: {
  name: string;
  email: string;
  password: string;
}) {
  const result = await authClient.signUp.email({
    ...data,
    callbackURL: '/onboarding',
  });
  
  if (result.user) {
    auth.currentUser = result.user;
  }
  
  return result;
}

export async function signOut() {
  await authClient.signOut();
  auth.currentUser = null;
  window.location.href = '/login';
}

export async function signInWithProvider(provider: 'google' | 'github') {
  await authClient.signIn.social({
    provider,
    callbackURL: '/dashboard',
  });
}