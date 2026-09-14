<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '#lib/components/ui/button/index.js';
  import { Card, CardContent, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
  import { Badge } from '#lib/components/ui/badge/index.js';
  import { Avatar, AvatarFallback, AvatarImage } from '#lib/components/ui/avatar/index.js';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '#lib/components/ui/tabs/index.js';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Settings from '@lucide/svelte/icons/settings';
  import Plus from '@lucide/svelte/icons/plus';
  import FileVideo from '@lucide/svelte/icons/file-video';
  import Users from '@lucide/svelte/icons/users';
  import Clock from '@lucide/svelte/icons/clock';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Eye from '@lucide/svelte/icons/eye';
  import { projectsStore, reviewsStore, commentsStore, teamsStore } from '#lib/stores/index.svelte.js';
  
  const projectId = $derived(page.params.id);
  
  
  // Get project from store
  const project = $derived(projectsStore.findById(projectId) || {
    id: projectId,
    name: 'Project Not Found',
    description: 'This project could not be loaded',
    color: '#8B5CF6',
    isTeam: false,
  });
  
  const reviews = $derived(reviewsStore.findByProject(projectId));
  const totalComments = $derived(
    reviews.reduce((sum, r) => sum + commentsStore.findByReview(r.id).length, 0)
  );
  
  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <Button variant="ghost" size="icon" href="/projects">
      <ArrowLeft class="h-5 w-5" />
    </Button>
    
    <div 
      class="h-12 w-12 rounded-lg flex items-center justify-center text-white"
      style="background-color: {project.color}"
    >
      <FileVideo class="h-6 w-6" />
    </div>
    
    <div class="flex-1">
      <h1 class="text-3xl font-bold">{project.name}</h1>
      <p class="text-muted-foreground">{project.description}</p>
    </div>
    
    <Button variant="outline" href="/projects/{projectId}/settings" class="gap-2">
      <Settings class="h-4 w-4" />
      Settings
    </Button>
    
    <Button href="/reviews/new?project={projectId}" class="gap-2">
      <Plus class="h-4 w-4" />
      New Review
    </Button>
  </div>

  <!-- Stats -->
  <div class="grid gap-4 md:grid-cols-3">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="text-sm font-medium">Total Reviews</CardTitle>
        <FileVideo class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{reviews.length}</div>
        <p class="text-xs text-muted-foreground">{reviews.filter(r => r.status === 'published').length} published</p>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="text-sm font-medium">Team Members</CardTitle>
        <Users class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{(project.members?.length || 0) + 1}</div>
        <p class="text-xs text-muted-foreground">{project.isTeam ? 'Team project' : 'Personal'}</p>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="text-sm font-medium">Comments</CardTitle>
        <MessageSquare class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{totalComments}</div>
        <p class="text-xs text-muted-foreground">across all reviews</p>
      </CardContent>
    </Card>
  </div>

  <!-- Tabs -->
  <Tabs value="reviews" class="space-y-4">
    <TabsList>
      <TabsTrigger value="reviews">Reviews</TabsTrigger>
      <TabsTrigger value="members">Team Members</TabsTrigger>
    </TabsList>
    
    <TabsContent value="reviews" class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each reviews as review}
          <a href="/reviews/{review.id}">
            <Card class="transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <CardTitle class="line-clamp-2">{review.title}</CardTitle>
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar class="h-6 w-6">
                    <AvatarImage src={review.authorAvatar} />
                    <AvatarFallback class="text-xs">{getInitials(review.authorName || 'User')}</AvatarFallback>
                  </Avatar>
                  <span>{review.authorName || 'Unknown'}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3 text-sm text-muted-foreground">
                    <div class="flex items-center gap-1">
                      <MessageSquare class="h-4 w-4" />
                      <span>{commentsStore.findByReview(review.id).length}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <Eye class="h-4 w-4" />
                      <span>{review.viewCount || 0}</span>
                    </div>
                  </div>
                  <Badge variant="outline" class={`badge-${review.status}`}>{review.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </a>
        {/each}
      </div>
    </TabsContent>
    
    <TabsContent value="members" class="space-y-4">
      {#if !project.members || project.members.length === 0}
        <Card>
          <CardContent class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-4">
             <Users class="h-12 w-12 opacity-20" />
            <p>No other team members yet.</p>
            <Button variant="outline" href="/projects/{projectId}/settings">Manage Team</Button>
          </CardContent>
        </Card>
      {:else}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {#each (project.members as any[]) as member}
            <Card>
              <CardContent class="flex items-center gap-4 p-4">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>{getInitials(member.email)}</AvatarFallback>
                </Avatar>
                <div>
                   <p class="font-medium">{member.email}</p>
                   <p class="text-sm text-muted-foreground capitalize">{member.role}</p>
                </div>
              </CardContent>
            </Card>
           {/each}
        </div>
      {/if}
    </TabsContent>
  </Tabs>
</div>
