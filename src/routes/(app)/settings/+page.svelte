<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import { Separator } from '$lib/components/ui/separator';
  import Camera from '@lucide/svelte/icons/camera';
  import Github from '@lucide/svelte/icons/github';
  import Chrome from '@lucide/svelte/icons/chrome';
  import { toast } from 'svelte-sonner';
  
  let name = $state('John Doe');
  let email = $state('john@example.com');
  let bio = $state('');
  let avatar = $state('');
  let saving = $state(false);
  
  async function handleSave() {
    saving = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully');
    } finally {
      saving = false;
    }
  }
  
  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold">Profile Settings</h2>
    <p class="text-muted-foreground">Manage your personal information</p>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Profile Information</CardTitle>
      <CardDescription>Update your personal details</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Avatar -->
      <div class="flex items-center gap-4">
        <Avatar class="h-20 w-20">
          <AvatarImage src={avatar} />
          <AvatarFallback class="text-2xl">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div class="space-y-2">
          <Button variant="outline" size="sm" class="gap-2">
            <Camera class="h-4 w-4" />
            Change Photo
          </Button>
          <p class="text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB</p>
        </div>
      </div>

      <Separator />

      <!-- Form Fields -->
      <div class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="name">Full Name</Label>
            <Input id="name" bind:value={name} />
          </div>
          
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" type="email" bind:value={email} disabled />
            <p class="text-xs text-muted-foreground">Verified</p>
          </div>
        </div>
        
        <div class="space-y-2">
          <Label for="bio">Bio</Label>
          <Textarea id="bio" bind:value={bio} placeholder="Tell us about yourself..." rows={4} />
        </div>
      </div>

      <Button onclick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Connected Accounts</CardTitle>
      <CardDescription>Manage your social account connections</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3">
      <div class="flex items-center justify-between p-3 border rounded-lg">
        <div class="flex items-center gap-3">
          <Github class="h-5 w-5" />
          <div>
            <p class="font-medium">GitHub</p>
            <p class="text-sm text-muted-foreground">@johndoe</p>
          </div>
        </div>
        <Button variant="outline" size="sm">Disconnect</Button>
      </div>
      
      <div class="flex items-center justify-between p-3 border rounded-lg">
        <div class="flex items-center gap-3">
          <Chrome class="h-5 w-5" />
          <div>
            <p class="font-medium">Google</p>
            <p class="text-sm text-muted-foreground">john@example.com</p>
          </div>
        </div>
        <Button variant="outline" size="sm">Disconnect</Button>
      </div>
    </CardContent>
  </Card>
</div>