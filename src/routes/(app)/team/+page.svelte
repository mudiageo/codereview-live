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
  
  let inviteEmail = $state('');
  let inviteOpen = $state(false);
  
  const members = [
    { id: '1', name: 'John Doe', email: 'john@example.com', avatar: '', role: 'owner', status: 'active' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatar: '', role: 'admin', status: 'active' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', avatar: '', role: 'member', status: 'active' },
  ];
  
  const pendingInvites = [
    { id: '1', email: 'newuser@example.com', role: 'member', invitedBy: 'John Doe', sentAt: '2 days ago' }
  ];
  
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
    console.log('Sending invite to:', inviteEmail);
    inviteEmail = '';
    inviteOpen = false;
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
      <CardTitle>Team Members ({members.length})</CardTitle>
      <CardDescription>People who have access to your projects</CardDescription>
    </CardHeader>
    <CardContent class="space-y-2">
      {#each members as member}
        <div class="flex items-center justify-between p-3 rounded-lg border">
          <div class="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={member.avatar} />
              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p class="font-medium flex items-center gap-2">
                {member.name}
                <svelte:component this={getRoleIcon(member.role)} class="h-3 w-3 text-muted-foreground" />
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
                  Invited by {invite.invitedBy} · {invite.sentAt}
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <Badge variant="outline">Pending</Badge>
              <Button variant="ghost" size="sm">Resend</Button>
              <Button variant="ghost" size="sm" class="text-destructive">Cancel</Button>
            </div>
          </div>
        {/each}
      </CardContent>
    </Card>
  {/if}
</div>