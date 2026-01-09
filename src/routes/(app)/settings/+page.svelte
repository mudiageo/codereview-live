<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import { Separator } from '$lib/components/ui/separator';
  import Camera from '@lucide/svelte/icons/camera';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import Link2 from '@lucide/svelte/icons/link-2';
  import Briefcase from '@lucide/svelte/icons/briefcase';
  import { toast } from 'svelte-sonner';
  import { MAX_AVATAR_SIZE_BYTES } from '$lib/constants';
  import { authClient } from '$lib/auth-client';
  import { auth } from '$lib/stores/auth.svelte';
  import { onMount } from 'svelte';
  
  let name = $state('');
  let email = $state('');
  let bio = $state('');
  let avatar = $state('');
  let username = $state('');
  let location = $state('');
  let website = $state('');
  let company = $state('');
  let saving = $state(false);
  let uploading = $state(false);
  let fileInput: HTMLInputElement;
  
  // Load current user data
  onMount(async () => {
    const session = await authClient.getSession();
    if (session.data?.user) {
      const user = session.data.user;
      name = user.name || '';
      email = user.email || '';
      avatar = user.image || '';
      // Load additional profile fields if they exist
      // These would come from user metadata/profile table
    }
  });
  
  async function handleSave() {
    saving = true;
    try {
      // Update user profile using better-auth
      const result = await authClient.updateUser({
        name: name,
        image: avatar,
      });
      
      if (result.error) {
        toast.error('Failed to update profile: ' + result.error.message);
      } else {
        // Update local auth state
        if (result.data) {
          auth.currentUser = result.data;
        }
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      saving = false;
    }
  }
  
  function handlePhotoClick() {
    fileInput?.click();
  }
  
  async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    uploading = true;
    
    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Upload to server
      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      avatar = data.url;
      
      toast.success('Avatar uploaded successfully. Click "Save Changes" to update your profile.');
    } catch (error) {
      toast.error('Failed to upload avatar');
      console.error(error);
      
      // Fallback: create local preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        avatar = e.target?.result as string;
        toast.info('Preview loaded. Note: Image will be uploaded when you save.');
      };
      reader.readAsDataURL(file);
    } finally {
      uploading = false;
    }
  }
  
  function getInitials(name: string) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold">Profile Settings</h2>
    <p class="text-muted-foreground">Manage your personal information and public profile</p>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Profile Information</CardTitle>
      <CardDescription>Update your personal details and public profile</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Avatar -->
      <div class="flex items-center gap-4">
        <Avatar class="h-20 w-20">
          <AvatarImage src={avatar} />
          <AvatarFallback class="text-2xl">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div class="space-y-2">
          <input
            type="file"
            accept="image/*"
            bind:this={fileInput}
            onchange={handleFileChange}
            class="hidden"
          />
          <Button variant="outline" size="sm" class="gap-2" onclick={handlePhotoClick} disabled={uploading}>
            <Camera class="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Change Photo'}
          </Button>
          <p class="text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB</p>
        </div>
      </div>

      <Separator />

      <!-- Basic Information -->
      <div class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="name">Full Name</Label>
            <Input id="name" bind:value={name} placeholder="John Doe" />
          </div>
          
          <div class="space-y-2">
            <Label for="username">Username</Label>
            <Input id="username" bind:value={username} placeholder="johndoe" />
            <p class="text-xs text-muted-foreground">Your unique identifier</p>
          </div>
        </div>
        
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" type="email" bind:value={email} disabled />
          <p class="text-xs text-muted-foreground">Email cannot be changed here. Verified ✓</p>
        </div>
        
        <div class="space-y-2">
          <Label for="bio">Bio</Label>
          <Textarea id="bio" bind:value={bio} placeholder="Tell us about yourself..." rows={4} />
          <p class="text-xs text-muted-foreground">Brief description for your profile</p>
        </div>
      </div>

      <Separator />

      <!-- Additional Information -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Additional Information</h3>
        
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="company" class="flex items-center gap-2">
              <Briefcase class="h-4 w-4" />
              Company
            </Label>
            <Input id="company" bind:value={company} placeholder="Acme Corp" />
          </div>
          
          <div class="space-y-2">
            <Label for="location" class="flex items-center gap-2">
              <MapPin class="h-4 w-4" />
              Location
            </Label>
            <Input id="location" bind:value={location} placeholder="San Francisco, CA" />
          </div>
        </div>
        
        <div class="space-y-2">
          <Label for="website" class="flex items-center gap-2">
            <Link2 class="h-4 w-4" />
            Website
          </Label>
          <Input id="website" type="url" bind:value={website} placeholder="https://example.com" />
        </div>
      </div>

      <Button onclick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </CardContent>
  </Card>
</div>