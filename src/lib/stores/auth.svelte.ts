
import { authClient } from '$lib/auth-client';
import type { User } from 'better-auth';
import { toast } from 'svelte-sonner'

class AuthState {
  currentUser: User | null = $state(null)
  isAuthenticated: boolean = $state(this.currentUser !== null)
  userPlan: boolean = $state(this.currentUser?.plan  || 'free')
  
  constructor() {
    // Initialize auth state
    if (typeof window !== 'undefined') {
      const session = authClient.getSession()
      if (session.data?.user) auth.currentUser = session.data.user;
    }
  }
  
  async signIn(email: string, password: string, rememberMe = false) {
    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: '/dashboard',
      rememberMe,
    },  {
      onSuccess: (ctx) => {
        this.currentUser = ctx.data.user;
      },
      onError: (ctx) => {
        // Handle the error
        if (ctx.error.status === 403) {
          toast("Please verify your email address");
        }
        
        toast(ctx.error.message);
      },
    });
  
    if (result.data.user) {
      this.currentUser = result.data.user;
    }
    
    return result;
  }
    
  async signUp(data) {
    const result = await authClient.signUp.email({
      ...data,
      callbackURL: '/onboarding',
    }, {
      onSuccess(ctx) {
        this.currentUser = ctx.data.user
      }
    });
    
    if (result.data?.user) {
      this.currentUser = result.dara.user;
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
        newUserCallbackURL: '/onboarding',
      });
}
}

export const auth = new AuthState()
export const currentUser: User | null = auth.currentUser;
export const isAuthenticated = auth.isAuthenticated;

export const userPlan = auth.userPlan;

// Initialize auth state
if (typeof window !== 'undefined') {
  const session = await authClient.getSession()

  if (session.data?.user) auth.currentUser = session.data.user;
}