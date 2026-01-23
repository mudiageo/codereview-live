<script lang="ts">
  import { page } from '$app/state';
  import { projectsStore } from '$lib/stores/index.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import { Badge } from '$lib/components/ui/badge';
  import { toast } from 'svelte-sonner';
  import { notificationsStore } from '$lib/stores/notifications.svelte';
  import Trash from '@lucide/svelte/icons/trash';
  import Save from '@lucide/svelte/icons/save';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';

  const projectId = $derived(page.params.id);

  // Use a derived value to keep it reactive, but we need to load first
  let project = $derived(projectsStore.findById(projectId));

  // Local state for edits
  let name = $state('');
  let description = $state('');
  let color = $state('');
  let settings = $state({
    isPublic: false,
    syncToRepo: false,
    allowComments: true,
    autoSummarize: false,
    requireApproval: false
  });

  // Invite state
  let inviteEmail = $state('');
  let inviteRole = $state('member');

  $effect(() => {
    projectsStore.load();
  });

  $effect(() => {
    if (project) {
      name = project.name;
      description = project.description || '';
      color = project.color || '#8B5CF6';
      settings = {
        isPublic: false,
        syncToRepo: false,
        allowComments: true,
        autoSummarize: false,
        requireApproval: false,
        ...(project.settings as any)
      };
    }
  });

  async function saveGeneral() {
    if (!project) return;
    try {
      await projectsStore.update(project.id, {
        name,
        description,
        color
      });
      await projectsStore.updateSettings(project.id, settings);
      toast.success('Project settings saved');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  }

  async function inviteMember() {
    if (!inviteEmail || !project) return;
    try {
      // In a real app, we'd lookup the user ID by email here.
      // For now, we simulate finding a user ID (or not) to demonstrate notification.
      // Let's assume we found a user ID for demo purposes if the email contains 'user'.
      const fakeUserId = inviteEmail.includes('user') ? 'some-user-id' : undefined;

      await projectsStore.addMember(project.id, {
        email: inviteEmail,
        role: inviteRole,
        userId: fakeUserId
      });

      if (fakeUserId) {
         await notificationsStore.create({
           userId: fakeUserId,
           type: 'project_invite',
           title: 'Project Invitation',
           message: `You have been invited to join ${project.name} as a ${inviteRole}.`,
           link: `/projects/${project.id}`,
           read: false
         });
      }

      toast.success(`Invited ${inviteEmail}`);
      inviteEmail = '';
    } catch (e) {
      toast.error('Failed to invite member');
    }
  }

  async function removeMember(email: string) {
    if (!project) return;
    try {
      if (confirm(`Are you sure you want to remove ${email}?`)) {
        await projectsStore.removeMember(project.id, email);
        toast.success('Member removed');
      }
    } catch (e) {
      toast.error('Failed to remove member');
    }
  }

  function getInitials(email: string) {
    return email.substring(0, 2).toUpperCase();
  }
</script>

<div class="container max-w-4xl py-6 space-y-6">
  <div class="flex items-center gap-4">
    <Button variant="ghost" size="icon" href={`/projects/${projectId}`}>
      <ArrowLeft class="h-4 w-4" />
    </Button>
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Project Settings</h1>
      <p class="text-muted-foreground">{project?.name || 'Loading...'}</p>
    </div>
  </div>

  {#if project}
    <Tabs value="general" class="space-y-4">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="team">Team & Access</TabsTrigger>
      </TabsList>

      <TabsContent value="general" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Update your project details and display settings.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-2">
              <Label for="name">Project Name</Label>
              <Input id="name" bind:value={name} />
            </div>
            <div class="grid gap-2">
              <Label for="description">Description</Label>
              <Textarea id="description" bind:value={description} />
            </div>
            <div class="grid gap-2">
              <Label for="color">Project Color</Label>
              <div class="flex gap-2">
                <Input id="color" type="color" class="w-12 h-10 p-1" bind:value={color} />
                <Input value={color} readonly class="flex-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features & Privacy</CardTitle>
            <CardDescription>Configure how others interact with your project.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
             <div class="flex items-center justify-between space-x-2">
              <Label for="public" class="flex flex-col space-y-1">
                <span>Public Visibility</span>
                <span class="font-normal text-muted-foreground">Anyone with the link can view this project.</span>
              </Label>
              <Switch id="public" bind:checked={settings.isPublic} />
            </div>
             <div class="flex items-center justify-between space-x-2">
              <Label for="comments" class="flex flex-col space-y-1">
                <span>Allow Comments</span>
                <span class="font-normal text-muted-foreground">Team members can leave comments on reviews.</span>
              </Label>
              <Switch id="comments" bind:checked={settings.allowComments} />
            </div>
             <div class="flex items-center justify-between space-x-2">
              <Label for="sync" class="flex flex-col space-y-1">
                <span>Sync to Repository</span>
                <span class="font-normal text-muted-foreground">Automatically sync changes to the git repository.</span>
              </Label>
              <Switch id="sync" bind:checked={settings.syncToRepo} />
            </div>
             <div class="flex items-center justify-between space-x-2">
              <Label for="ai" class="flex flex-col space-y-1">
                <span>Auto Summarize</span>
                <span class="font-normal text-muted-foreground">Use AI to generate summaries for new reviews.</span>
              </Label>
              <Switch id="ai" bind:checked={settings.autoSummarize} />
            </div>
          </CardContent>
        </Card>

        <div class="flex justify-end">
          <Button onclick={saveGeneral} class="gap-2">
            <Save class="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="team" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage who has access to this project.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="flex items-end gap-4">
              <div class="grid gap-2 flex-1">
                <Label for="invite-email">Add Member</Label>
                <Input
                  id="invite-email"
                  placeholder="colleague@example.com"
                  bind:value={inviteEmail}
                />
              </div>
               <div class="grid gap-2 w-[180px]">
                <Label for="invite-role">Role</Label>
                <select
                  id="invite-role"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  bind:value={inviteRole}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <Button onclick={inviteMember} disabled={!inviteEmail}>Invite</Button>
            </div>

            <div class="rounded-md border">
              {#if !project.members || project.members.length === 0}
                 <div class="p-4 text-center text-muted-foreground">
                   No members added yet.
                 </div>
              {:else}
                {#each (project.members as any[]) as member}
                  <div class="flex items-center justify-between p-4 border-b last:border-0">
                    <div class="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>{getInitials(member.email)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p class="font-medium leading-none">{member.email}</p>
                        <p class="text-sm text-muted-foreground capitalize">
                          {member.role} • {member.status}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-destructive hover:text-destructive"
                      onclick={() => removeMember(member.email)}
                    >
                      <Trash class="h-4 w-4" />
                    </Button>
                  </div>
                {/each}
              {/if}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  {/if}
</div>
