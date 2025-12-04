<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import Video from '@lucide/svelte/icons/video';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Mail from '@lucide/svelte/icons/mail';
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
  
  let email = $state('');
  let loading = $state(false);
  let sent = $state(false);
  
  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    
    try {
      // TODO: Call password reset API
      await new Promise(resolve => setTimeout(resolve, 1000));
      sent = true;
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
  <div class="w-full max-w-md">
    <Card class="border-border/50 shadow-xl">
      <CardHeader class="space-y-3 text-center">
        {#if !sent}
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 backdrop-blur-sm">
            <Mail class="h-7 w-7 text-primary" />
          </div>
          <CardTitle class="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a reset link
          </CardDescription>
        {:else}
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 backdrop-blur-sm">
            <CheckCircle2 class="h-7 w-7 text-primary" />
          </div>
          <CardTitle class="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            We've sent a password reset link to {email}
          </CardDescription>
        {/if}
      </CardHeader>
      
      <CardContent>
        {#if !sent}
          <form onsubmit={handleSubmit} class="space-y-4">
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
            
            <Button type="submit" class="w-full" disabled={loading || !email}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        {:else}
          <div class="space-y-4">
            <p class="text-sm text-center text-muted-foreground">
              Didn't receive the email? Check your spam folder or
            </p>
            <Button variant="outline" class="w-full" onclick={() => sent = false}>
              Try Another Email
            </Button>
          </div>
        {/if}
      </CardContent>
      
      <CardFooter class="justify-center">
        <Button variant="ghost" href="/login" class="gap-2">
          <ArrowLeft class="h-4 w-4" />
          Back to Login
        </Button>
      </CardFooter>
    </Card>
  </div>
</div>