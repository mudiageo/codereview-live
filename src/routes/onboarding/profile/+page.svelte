<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import Camera from '@lucide/svelte/icons/camera';
  
  let name = $state('');
  let role = $state('');
  let avatar = $state('');
  let loading = $state(false);
  
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
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  
  async function handleSubmit() {
    loading = true;
    // Save profile data
    await new Promise(resolve => setTimeout(resolve, 500));
    window.location.href = '/onboarding/preferences';
  }
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
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
            class="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
          >
            <Camera class="h-4 w-4" />
          </button>
        </div>
        <Button variant="outline" size="sm">Upload Photo</Button>
      </div>
      
      <!-- Form Fields -->
      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="name">Display Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            bind:value={name}
            required
          />
        </div>
        
        <div class="space-y-2">
          <Label for="role">Your Role</Label>
          <Select bind:value={role}>
            <SelectTrigger>
              {role || "Select your role"}
            </SelectTrigger>
            <SelectContent>
              {#each roles as roleOption}
                <SelectItem value={roleOption}>{roleOption}</SelectItem>
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
