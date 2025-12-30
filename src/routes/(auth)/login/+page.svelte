<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Separator } from '$lib/components/ui/separator';
  import Video from '@lucide/svelte/icons/video';
  import Github from '@lucide/svelte/icons/github';
  import Chrome from '@lucide/svelte/icons/chrome';
  import AlertCircle from '@lucide/svelte/icons/alert-circle';
  import { authClient } from '$lib/auth-client';
  import { auth } from '$lib/stores/auth.svelte';
  import { goto } from '$app/navigation';
  
  let email = $state('');
  let password = $state('');
  let rememberMe = $state(false);
  let loading = $state(false);
  let error = $state('');
  
  async function handleLogin(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';
    
    try {
      // Call your Better-Auth login function here
       const result = await auth.signIn(email, password, rememberMe);
      
      if(result.data.user) goto('/dashboard');
      else error = result.error
      
    } catch (err) {
      error = 'Invalid email or password. Please try again.';
    } finally {
      loading = false;
    }
  }
  
  async function handleSocialLogin(provider: 'google' | 'github') {
    loading = true;
    error = '';
    
    try {
      // Call Better-Auth social login
       await auth.signInWithProvider({ provider });
      console.log(`Logging in with ${provider}`);
    } catch (err) {
      error = `Failed to login with ${provider}. Please try again.`;
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
  <div class="w-full max-w-md">
    <Card class="border-border/50 shadow-xl">
      <CardHeader class="space-y-3 text-center">
        <!-- Logo -->
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 backdrop-blur-sm">
          <Video class="h-7 w-7 text-primary" />
        </div>
        
        <CardTitle class="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your CodeReview.live account
        </CardDescription>
      </CardHeader>
      
      <CardContent class="space-y-4">
        <!-- Error Alert -->
        {#if error}
          <div class="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle class="h-4 w-4" />
            <p>{error}</p>
          </div>
        {/if}
        
        <!-- Email/Password Form -->
        <form onsubmit={handleLogin} class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              bind:value={email}
              required
              disabled={loading}
            />
          </div>
          
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="password">Password</Label>
              <a
                href="/forgot-password"
                class="text-sm text-primary hover:underline"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              bind:value={password}
              required
              disabled={loading}
            />
          </div>
          
          <div class="flex items-center space-x-2">
            <Checkbox id="remember" bind:checked={rememberMe} disabled={loading} />
            <Label
              for="remember"
              class="text-sm font-normal cursor-pointer"
            >
              Remember me for 30 days
            </Label>
          </div>
          
          <Button type="submit" class="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        
        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <Separator class="w-full" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        
        <!-- Social Login Buttons -->
        <div class="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            type="button"
            onclick={() => handleSocialLogin('google')}
            disabled={loading}
            class="gap-2"
          >
            <Chrome class="h-4 w-4" />
            Google
          </Button>
          
          <Button
            variant="outline"
            type="button"
            onclick={() => handleSocialLogin('github')}
            disabled={loading}
            class="gap-2"
          >
            <Github class="h-4 w-4" />
            GitHub
          </Button>
        </div>
      </CardContent>
      
      <CardFooter class="flex-col space-y-4">
        <div class="text-center text-sm text-muted-foreground">
          Don't have an account?
          <a href="/signup" class="font-medium text-primary hover:underline">
            Sign up
          </a>
        </div>
      </CardFooter>
    </Card>
    
    <!-- Footer Text -->
    <p class="mt-6 text-center text-xs text-muted-foreground">
      By continuing, you agree to our
      <a href="/terms" class="underline hover:text-foreground">Terms of Service</a>
      and
      <a href="/privacy" class="underline hover:text-foreground">Privacy Policy</a>
    </p>
  </div>
</div>