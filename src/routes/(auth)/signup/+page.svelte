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
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
  import { authClient } from '$lib/auth-client';
  import { auth } from '$lib/stores/auth.svelte';
  import { goto } from '$app/navigation'
 
  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let acceptTerms = $state(false);
  let loading = $state(false);
  let error = $state('');
  let passwordStrength = $state(0);
  let verificationEmailSent = $state(false);
  let userEmail = $state('');
  
  // Password strength calculator
  $effect(() => {
    if (!password) {
      passwordStrength = 0;
      return;
    }
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    passwordStrength = Math.min(strength, 4);
  });
  
  function getStrengthColor() {
    if (passwordStrength <= 1) return 'bg-destructive';
    if (passwordStrength === 2) return 'bg-warning';
    if (passwordStrength === 3) return 'bg-chart-4';
    return 'bg-chart-2';
  }
  
  function getStrengthText() {
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  }
  
  async function handleSignup(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';
    
    // Validation
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      loading = false;
      return;
    }
    
    if (!acceptTerms) {
      error = 'You must accept the Terms of Service and Privacy Policy';
      loading = false;
      return;
    }
    
    if (passwordStrength < 2) {
      error = 'Please choose a stronger password';
      loading = false;
      return;
    }
    
    try {
      // Call your Better-Auth signup function here
       const result = await auth.signUp({ name, email, password });
      
      // On success, show verification email sent message
      if(result.data.user) {
        verificationEmailSent = true;
        userEmail = email;
      } else {
        error = result.error;
      }
    } catch (err) {
      error = 'Failed to create account. Email may already be in use.';
      console.log(err)
    } finally {
      loading = false;
    }
  }
  
  async function resendVerificationEmail() {
    loading = true;
    try {
      // Call resend verification endpoint
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      // Show success toast or message
    } catch (err) {
      error = 'Failed to resend verification email';
    } finally {
      loading = false;
    }
  }
  
  async function handleSocialSignup(provider: 'google' | 'github') {
    loading = true;
    error = '';
    
    try {
      // Call Better-Auth social signup
      await auth.signInWithProvider(provider);
      console.log(`Signing up with ${provider}`);
    } catch (err) {
      error = `Failed to sign up with ${provider}. Please try again.`;
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
        
        <CardTitle class="text-2xl font-bold">Create your account</CardTitle>
        <CardDescription>
          Get started with CodeReview.live today
        </CardDescription>
      </CardHeader>
      
      <CardContent class="space-y-4">
        {#if verificationEmailSent}
          <!-- Verification Email Sent Message -->
          <div class="space-y-4 text-center py-6">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-chart-2/10">
              <CheckCircle2 class="h-8 w-8 text-chart-2" />
            </div>
            
            <div class="space-y-2">
              <h3 class="text-lg font-semibold">Check your email</h3>
              <p class="text-sm text-muted-foreground">
                We've sent a verification link to
              </p>
              <p class="text-sm font-medium">{userEmail}</p>
              <p class="text-sm text-muted-foreground mt-4">
                Click the link in the email to verify your account and complete your registration.
              </p>
            </div>
            
            <div class="space-y-2 pt-4">
              <Button
                variant="outline"
                class="w-full"
                onclick={resendVerificationEmail}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </Button>
              <Button
                variant="ghost"
                class="w-full"
                href="/login"
              >
                Go to Login
              </Button>
            </div>
            
            <p class="text-xs text-muted-foreground pt-4">
              Didn't receive the email? Check your spam folder or try resending.
            </p>
          </div>
        {:else}
        <!-- Error Alert -->
        {#if error}
          <div class="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle class="h-4 w-4" />
            <p>{error}</p>
          </div>
        {/if}
        
        <!-- Signup Form -->
        <form onsubmit={handleSignup} class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              bind:value={name}
              required
              disabled={loading}
            />
          </div>
          
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
            <Label for="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              bind:value={password}
              required
              disabled={loading}
            />
            
            <!-- Password Strength Indicator -->
            {#if password}
              <div class="space-y-1">
                <div class="flex gap-1">
                  {#each Array(4) as _, i}
                    <div
                      class="h-1 flex-1 rounded-full transition-colors {i < passwordStrength ? getStrengthColor() : 'bg-muted'}"
                    ></div>
                  {/each}
                </div>
                <p class="text-xs text-muted-foreground">
                  Password strength: <span class="font-medium">{getStrengthText()}</span>
                </p>
              </div>
            {/if}
          </div>
          
          <div class="space-y-2">
            <Label for="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              bind:value={confirmPassword}
              required
              disabled={loading}
            />
            
            <!-- Password Match Indicator -->
            {#if confirmPassword && password}
              <div class="flex items-center gap-1 text-xs">
                {#if password === confirmPassword}
                  <CheckCircle2 class="h-3 w-3 text-chart-2" />
                  <span class="text-chart-2">Passwords match</span>
                {:else}
                  <AlertCircle class="h-3 w-3 text-destructive" />
                  <span class="text-destructive">Passwords do not match</span>
                {/if}
              </div>
            {/if}
          </div>
          
          <div class="flex items-start space-x-2">
            <Checkbox
              id="terms"
              bind:checked={acceptTerms}
              disabled={loading}
              class="mt-0.5"
            />
            <Label
              for="terms"
              class="text-sm font-normal leading-tight cursor-pointer"
            >
              I agree to the
              <a href="/terms" class="text-primary hover:underline" target="_blank">
                Terms of Service
              </a>
              and
              <a href="/privacy" class="text-primary hover:underline" target="_blank">
                Privacy Policy
              </a>
            </Label>
          </div>
          
          <Button type="submit" class="w-full" disabled={loading || !acceptTerms}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        {/if}
        
        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <Separator class="w-full" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-card px-2 text-muted-foreground">Or sign up with</span>
          </div>
        </div>
        
        <!-- Social Signup Buttons -->
        <div class="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            type="button"
            onclick={() => handleSocialSignup('google')}
            disabled={loading}
            class="gap-2"
          >
            <Chrome class="h-4 w-4" />
            Google
          </Button>
          
          <Button
            variant="outline"
            type="button"
            onclick={() => handleSocialSignup('github')}
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
          Already have an account?
          <a href="/login" class="font-medium text-primary hover:underline">
            Sign in
          </a>
        </div>
      </CardFooter>
    </Card>
    
    <!-- Benefits -->
    <div class="mt-6 space-y-2">
      <p class="text-center text-xs font-medium text-muted-foreground">
        What you'll get:
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <div class="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs">
          <CheckCircle2 class="h-3 w-3 text-primary" />
          <span>Unlimited local reviews</span>
        </div>
        <div class="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs">
          <CheckCircle2 class="h-3 w-3 text-primary" />
          <span>10 cloud syncs/month</span>
        </div>
        <div class="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs">
          <CheckCircle2 class="h-3 w-3 text-primary" />
          <span>50 AI credits</span>
        </div>
      </div>
    </div>
  </div>
</div>