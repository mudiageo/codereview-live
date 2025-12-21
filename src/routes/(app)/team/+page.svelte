<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu';
  import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
  import { Label } from '$lib/components/ui/label';
  import UserPlus from '@lucide/svelte/icons/user-plus';
  import MoreVertical from '@lucide/svelte/icons/more-vertical';
  import Mail from '@lucide/svelte/icons/mail';
  import Shield from '@lucide/svelte/icons/shield';
  import Crown from '@lucide/svelte/icons/crown';
  import Users from '@lucide/svelte/icons/users';
  import { teamsStore, teamInvitationsStore } from '$lib/stores/index.svelte';
  import { toast } from 'svelte-sonner';
  
  let inviteEmail = $state('');
  let inviteOpen = $state(false);
  
  // Load stores
  $effect(() => {
    teamsStore.load();
    teamInvitationsStore.load();
  });
  
  const members = $derived([
    // In real implementation, you'd fetch team members from a separate store
    // For now, showing placeholder based on team existence
  ]);
  
  const pendingInvites = $derived(teamInvitationsStore.pending);
  
  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  function getRoleIcon(role: string) {
    switch (role) {
      case 'owner': return Crown;
      case 'admin': return Shield;
      default: return Users;
    }
  }
  
  async function sendInvite() {
    if (!inviteEmail) return;
    
    const currentTeam = teamsStore.current;
    if (!currentTeam) {
      toast.error('No team found. Create a team first.');
      return;
    }
    
    try {
      await teamInvitationsStore.create({
        teamId: currentTeam.id,
        email: inviteEmail,
        role: 'member',
        invitedBy: currentTeam.ownerId,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      
      toast.success(`Invitation sent to ${inviteEmail}`);
      inviteEmail = '';
      inviteOpen = false;
    } catch (error) {
      toast.error('Failed to send invitation');
      console.error(error);
    }
  }

  async function resendInvite(invite: any) {
    toast.info('Resending invitation...');
    // In real implementation, would update the invitation
  }

  async function cancelInvite(inviteId: string) {
    try {
      await teamInvitationsStore.delete(inviteId);
      toast.success('Invitation cancelled');
    } catch (error) {
      toast.error('Failed to cancel invitation');
    }
  }

  function formatTimestamp(date: Date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 1) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Team</h1>
      <p class="text-muted-foreground">Manage your team members and permissions</p>
    </div>
    <Dialog bind:open={inviteOpen}>
      <DialogTrigger>
        {#snippet child(props)}
          <Button {...props} class="gap-2">
          <UserPlus class="h-4 w-4" />
          Invite Member
        </Button>
        {/snippet}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your team
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              bind:value={inviteEmail}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onclick={() => inviteOpen = false}>Cancel</Button>
          <Button onclick={sendInvite} disabled={!inviteEmail}>Send Invitation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>

  <!-- Team Members -->
  <Card>
    <CardHeader>
      <CardTitle>Team Members ({members.length || (teamsStore.current?.memberCount || 1)})</CardTitle>
      <CardDescription>People who have access to your projects</CardDescription>
    </CardHeader>
    <CardContent class="space-y-2">
      {#if members.length === 0}
        <div class="text-center p-8 text-muted-foreground">
          <Users class="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No team members yet. Invite your first member to get started!</p>
        </div>
      {:else}
        {#each members as member}
          {@const Icon = getRoleIcon(member.role) }
          <div class="flex items-center justify-between p-3 rounded-lg border">
            <div class="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={member.avatar} />
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p class="font-medium flex items-center gap-2">
                  {member.name}
                  <Icon class="h-3 w-3 text-muted-foreground" />
                </p>
                <p class="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <Badge variant="secondary" class="capitalize">{member.role}</Badge>
              
              {#if member.role !== 'owner'}
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    {#snippet child(props)}
                    <Button {...props} variant="ghost" size="icon">
                      <MoreVertical class="h-4 w-4" />
                    </Button>
                    {/snippet}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Change Role</DropdownMenuItem>
                    <DropdownMenuItem class="text-destructive">Remove</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </CardContent>
  </Card>

  <!-- Pending Invitations -->
  {#if pendingInvites.length > 0}
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>Invitations waiting for acceptance</CardDescription>
      </CardHeader>
      <CardContent class="space-y-2">
        {#each pendingInvites as invite}
          <div class="flex items-center justify-between p-3 rounded-lg border">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Mail class="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p class="font-medium">{invite.email}</p>
                <p class="text-sm text-muted-foreground">
                  Invited {formatTimestamp(invite.createdAt)}
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <Badge variant="outline">Pending</Badge>
              <Button variant="ghost" size="sm" onclick={() => resendInvite(invite)}>Resend</Button>
              <Button variant="ghost" size="sm" class="text-destructive" onclick={() => cancelInvite(invite.id)}>Cancel</Button>
            </div>
          </div>
        {/each}
      </CardContent>
    </Card>
  {/if}
</div>