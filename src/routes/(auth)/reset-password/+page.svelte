<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import KeyRound from '@lucide/svelte/icons/key-round';
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
  import AlertCircle from '@lucide/svelte/icons/alert-circle';
  
  const token = $derived($page.url.searchParams.get('token'));
  
  let password = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);
  let success = $state(false);
  let error = $state('');
  let passwordStrength = $state(0);
  
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
  
  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = '';
    
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }
    
    if (passwordStrength < 2) {
      error = 'Please choose a stronger password';
      return;
    }
    
    loading = true;
    
    try {
      // TODO: Call password reset API with token
      await new Promise(resolve => setTimeout(resolve, 1000));
      success = true;
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      error = 'Failed to reset password. The link may have expired.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
  <div class="w-full max-w-md">
    <Card class="border-border/50 shadow-xl">
      <CardHeader class="space-y-3 text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 backdrop-blur-sm">
          {#if success}
            <CheckCircle2 class="h-7 w-7 text-primary" />
          {:else}
            <KeyRound class="h-7 w-7 text-primary" />
          {/if}
        </div>
        <CardTitle class="text-2xl font-bold">
          {success ? 'Password Reset!' : 'Set New Password'}
        </CardTitle>
        <CardDescription>
          {success ? 'Redirecting to login...' : 'Choose a strong password for your account'}
        </CardDescription>
      </CardHeader>
      
      {#if !success}
        <CardContent>
          {#if error}
            <div class="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mb-4">
              <AlertCircle class="h-4 w-4" />
              <p>{error}</p>
            </div>
          {/if}
          
          <form onsubmit={handleSubmit} class="space-y-4">
            <div class="space-y-2">
              <Label for="password">New Password</Label>
              <Input
                id="password"
                type="password"
                bind:value={password}
                required
                disabled={loading}
              />
              
              {#if password}
                <div class="space-y-1">
                  <div class="flex gap-1">
                    {#each Array(4) as _, i}
                      <div class="h-1 flex-1 rounded-full transition-colors {i < passwordStrength ? getStrengthColor() : 'bg-muted'}"></div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
            
            <div class="space-y-2">
              <Label for="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                bind:value={confirmPassword}
                required
                disabled={loading}
              />
            </div>
            
            <Button type="submit" class="w-full" disabled={loading || !password || !confirmPassword}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      {/if}
    </Card>
  </div>
</div>