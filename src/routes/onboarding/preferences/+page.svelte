<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { goto } from '$app/navigation'
  
  let theme = $state('dark');
  let aiEnabled = $state(true);
  let autoSync = $state(false);
  let loading = $state(false);
  
  const dots = [true, true, true];
  
  async function handleComplete() {
    loading = true;
    // Save preferences
    await new Promise(resolve => setTimeout(resolve, 500));
    goto('/dashboard');
  }
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
  <Card class="w-full max-w-lg border-border/50 shadow-xl">
    <CardHeader class="text-center space-y-2">
      <CardTitle class="text-2xl font-bold">Customize Your Experience</CardTitle>
      <CardDescription>Set your preferences (you can change these later)</CardDescription>
    </CardHeader>
    
    <CardContent class="space-y-6">
      <!-- Theme Selection -->
      <div class="space-y-3">
        <Label>Theme</Label>
        <RadioGroup bind:value={theme} class="grid grid-cols-3 gap-4">
          <div>
            <RadioGroupItem value="light" id="light" class="peer sr-only" />
            <Label
              for="light"
              class="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <div class="mb-2 h-12 w-12 rounded-md bg-white border"></div>
              <span class="text-sm font-medium">Light</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="dark" id="dark" class="peer sr-only" />
            <Label
              for="dark"
              class="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <div class="mb-2 h-12 w-12 rounded-md bg-slate-950 border"></div>
              <span class="text-sm font-medium">Dark</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="system" id="system" class="peer sr-only" />
            <Label
              for="system"
              class="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <div class="mb-2 h-12 w-12 rounded-md bg-gradient-to-br from-white to-slate-950 border"></div>
              <span class="text-sm font-medium">System</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      <!-- Feature Toggles -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label>AI Features</Label>
            <p class="text-sm text-muted-foreground">
              Enable AI-powered code explanations and suggestions
            </p>
          </div>
          <Switch bind:checked={aiEnabled} />
        </div>
        
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label>Auto-sync</Label>
            <p class="text-sm text-muted-foreground">
              Automatically sync reviews to cloud
            </p>
          </div>
          <Switch bind:checked={autoSync} />
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
      <Button variant="ghost" href="/onboarding/profile">Back</Button>
      <Button onclick={handleComplete} disabled={loading}>
        {loading ? 'Finishing...' : 'Start Reviewing'}
      </Button>
    </CardFooter>
  </Card>
</div>