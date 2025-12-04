<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Settings from '@lucide/svelte/icons/settings';
  import Plus from '@lucide/svelte/icons/plus';
  import FileVideo from '@lucide/svelte/icons/file-video';
  import Users from '@lucide/svelte/icons/users';
  import Clock from '@lucide/svelte/icons/clock';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Eye from '@lucide/svelte/icons/eye';
  
  const projectId = $derived(page.params.id);
  
  const project = {
    id: projectId,
    name: 'My Awesome App',
    description: 'Main web application',
    color: '#8B5CF6',
    repoUrl: 'https://github.com/user/repo',
    isTeam: true,
    members: [
      { id: '1', name: 'John Doe', avatar: '', role: 'owner' },
      { id: '2', name: 'Jane Smith', avatar: '', role: 'admin' },
    ]
  };
  
  const reviews = [
    {
      id: '1',
      title: 'Add JWT Authentication',
      author: { name: 'John Doe', avatar: '' },
      status: 'published',
      commentCount: 5,
      viewCount: 12,
      createdAt: '2 hours ago'
    }
  ];
  
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
    
    <Button variant="outline" class="gap-2">
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
        <div class="text-2xl font-bold">24</div>
        <p class="text-xs text-muted-foreground">+3 this week</p>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="text-sm font-medium">Team Members</CardTitle>
        <Users class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{project.members.length}</div>
        <p class="text-xs text-muted-foreground">2 active today</p>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="text-sm font-medium">Comments</CardTitle>
        <MessageSquare class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">142</div>
        <p class="text-xs text-muted-foreground">+18 this week</p>
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
                    <AvatarImage src={review.author.avatar} />
                    <AvatarFallback class="text-xs">{getInitials(review.author.name)}</AvatarFallback>
                  </Avatar>
                  <span>{review.author.name}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3 text-sm text-muted-foreground">
                    <div class="flex items-center gap-1">
                      <MessageSquare class="h-4 w-4" />
                      <span>{review.commentCount}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <Eye class="h-4 w-4" />
                      <span>{review.viewCount}</span>
                    </div>
                  </div>
                  <Badge variant="outline" class="badge-published">{review.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </a>
        {/each}
      </div>
    </TabsContent>
    
    <TabsContent value="members" class="space-y-2">
      {#each project.members as member}
        <Card>
          <CardContent class="flex items-center justify-between p-4">
            <div class="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={member.avatar} />
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p class="font-medium">{member.name}</p>
                <p class="text-sm text-muted-foreground capitalize">{member.role}</p>
              </div>
            </div>
            <Badge variant="secondary">{member.role}</Badge>
          </CardContent>
        </Card>
      {/each}
    </TabsContent>
  </Tabs>
</div>