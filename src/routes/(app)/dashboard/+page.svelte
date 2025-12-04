<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import FileVideo from '@lucide/svelte/icons/file-video';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Users from '@lucide/svelte/icons/users';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Plus from '@lucide/svelte/icons/plus';
  import Upload from '@lucide/svelte/icons/upload';
  import Folder from '@lucide/svelte/icons/folder';
  import UserPlus from '@lucide/svelte/icons/user-plus';
  import TrendingUp from '@lucide/svelte/icons/trending-up';
  import Eye from '@lucide/svelte/icons/eye';
  import Clock from '@lucide/svelte/icons/clock';

  // Mock data - replace with actual data fetching
  let loading = $state(false);
  
  const stats = [
    {
      title: 'Total Reviews',
      value: '24',
      change: '+3 from last week',
      icon: FileVideo,
      color: 'text-chart-1'
    },
    {
      title: 'Comments',
      value: '142',
      change: '+12 this week',
      icon: MessageSquare,
      color: 'text-chart-2'
    },
    {
      title: 'Team Members',
      value: '8',
      change: '3 active now',
      icon: Users,
      color: 'text-chart-3'
    },
    {
      title: 'AI Credits',
      value: '847',
      change: '152 used this month',
      icon: Sparkles,
      color: 'text-chart-4'
    }
  ];
  
  const recentReviews = [
    {
      id: '1',
      title: 'Add JWT Authentication to API',
      author: { name: 'John Doe', avatar: '' },
      timestamp: '2 hours ago',
      status: 'published',
      commentCount: 5,
      viewCount: 12,
      duration: '4:32',
      thumbnail: ''
    },
    {
      id: '2',
      title: 'Refactor User Dashboard Component',
      author: { name: 'Jane Smith', avatar: '' },
      timestamp: '5 hours ago',
      status: 'published',
      commentCount: 8,
      viewCount: 24,
      duration: '6:15',
      thumbnail: ''
    },
    {
      id: '3',
      title: 'Fix Payment Processing Bug',
      author: { name: 'Mike Johnson', avatar: '' },
      timestamp: '1 day ago',
      status: 'draft',
      commentCount: 2,
      viewCount: 5,
      duration: '3:48',
      thumbnail: ''
    }
  ];
  
  const quickActions = [
    { icon: Upload, label: 'Import from GitHub', href: '/reviews/new?source=github' },
    { icon: Folder, label: 'Create Project', href: '/projects/new' },
    { icon: UserPlus, label: 'Invite Team', href: '/team/invite' }
  ];
  
  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'published': return 'badge-published';
      case 'draft': return 'badge-draft';
      case 'archived': return 'badge-archived';
      default: return '';
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">Welcome back! Here's what's happening.</p>
    </div>
    <Button href="/reviews/new" class="gap-2">
      <Plus class="h-4 w-4" />
      New Review
    </Button>
  </div>

  <!-- Stats Grid -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {#if loading}
      {#each Array(4) as _}
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton class="h-8 w-16 mb-1" />
            <Skeleton class="h-3 w-32" />
          </CardContent>
        </Card>
      {/each}
    {:else}
      {#each stats as stat}
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon class="h-4 w-4 {stat.color}" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{stat.value}</div>
            <p class="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp class="h-3 w-3" />
              {stat.change}
            </p>
          </CardContent>
        </Card>
      {/each}
    {/if}
  </div>

  <!-- Recent Reviews -->
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold">Recent Reviews</h2>
      <Button variant="ghost" href="/reviews">View All</Button>
    </div>
    
    {#if loading}
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each Array(3) as _}
          <Card>
            <Skeleton class="aspect-video w-full" />
            <CardHeader>
              <Skeleton class="h-4 w-3/4" />
              <Skeleton class="h-3 w-1/2" />
            </CardHeader>
          </Card>
        {/each}
      </div>
    {:else if recentReviews.length === 0}
      <Card>
        <CardContent class="flex flex-col items-center justify-center p-12 text-center">
          <div class="rounded-full bg-muted p-4 mb-4">
            <FileVideo class="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 class="text-lg font-semibold mb-2">No reviews yet</h3>
          <p class="text-sm text-muted-foreground mb-4 max-w-sm">
            Get started by creating your first code review
          </p>
          <Button href="/reviews/new" class="gap-2">
            <Plus class="h-4 w-4" />
            Create Review
          </Button>
        </CardContent>
      </Card>
    {:else}
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each recentReviews as review}
          <a href="/reviews/{review.id}" class="group">
            <Card class="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <!-- Thumbnail -->
              <div class="relative aspect-video bg-muted">
                {#if review.thumbnail}
                  <img src={review.thumbnail} alt="" class="object-cover w-full h-full" />
                {:else}
                  <div class="absolute inset-0 flex items-center justify-center">
                    <FileVideo class="h-12 w-12 text-muted-foreground" />
                  </div>
                {/if}
                
                <!-- Duration Badge -->
                <Badge class="absolute bottom-2 right-2 bg-black/80 hover:bg-black/80">
                  <Clock class="h-3 w-3 mr-1" />
                  {review.duration}
                </Badge>
              </div>

              <CardHeader class="space-y-2">
                <CardTitle class="line-clamp-2 group-hover:text-primary transition-colors">
                  {review.title}
                </CardTitle>
                
                <div class="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Avatar class="h-6 w-6">
                    <AvatarImage src={review.author.avatar} />
                    <AvatarFallback class="text-xs">
                      {getInitials(review.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span class="truncate">{review.author.name}</span>
                  <span>·</span>
                  <span>{review.timestamp}</span>
                </div>

                <!-- Stats & Status -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3 text-sm text-muted-foreground">
                    <div class="flex items-center space-x-1">
                      <MessageSquare class="h-4 w-4" />
                      <span>{review.commentCount}</span>
                    </div>
                    <div class="flex items-center space-x-1">
                      <Eye class="h-4 w-4" />
                      <span>{review.viewCount}</span>
                    </div>
                  </div>
                  <Badge variant="outline" class={getStatusColor(review.status)}>
                    {review.status}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          </a>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Quick Actions -->
  <Card>
    <CardHeader>
      <CardTitle>Quick Actions</CardTitle>
      <CardDescription>Common tasks to get you started</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid gap-2 md:grid-cols-3">
        {#each quickActions as action}
          <Button variant="outline" href={action.href} class="justify-start gap-2 h-auto py-3">
            <action.icon class="h-5 w-5" />
            {action.label}
          </Button>
        {/each}
      </div>
    </CardContent>
  </Card>
</div>