<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { Badge } from '$lib/components/ui/badge';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Upload from '@lucide/svelte/icons/upload';
  import Github from '@lucide/svelte/icons/github';
  import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
  import Save from '@lucide/svelte/icons/save';
  import VideoIcon from '@lucide/svelte/icons/video';
  import Circle from '@lucide/svelte/icons/circle';
  import Square from '@lucide/svelte/icons/square';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import AuthGuard from '$lib/components/auth-guard.svelte';
  import PaywallDialog from '$lib/components/paywall-dialog.svelte';
  import LimitReached from '$lib/components/limit-reached.svelte';
  import UpgradeDialog from '$lib/components/upgrade-dialog.svelte';
  import CodeEditor from '$lib/components/code-editor.svelte';
  import MediaRecorder from '$lib/components/media-recorder.svelte';
  import VideoUploader from '$lib/components/video-uploader.svelte';
  import { reviewsStore, projectsStore, subscriptionsStore, aiUsageStore } from '$lib/stores/index.svelte';
  import { auth } from '$lib/stores/auth.svelte';
  import { hasFeatureAccess, getLimit, isWithinLimit } from '$lib/config';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { page } from '$app/state';

  let step = $state(1);
  let title = $state('');
  let description = $state('');
  let projectId = $state(page.url.searchParams.get('project') || '');
  let code = $state('');
  let language = $state('javascript');
  let isRecording = $state(false);
  let recordingTime = $state(0);
  let videoBlob = $state<Blob | null>(null);
  let thumbnail = $state<string>('');
  let aiSummary = $state('');
  let loading = $state(false);
  let showPaywall = $state(false);
  let showUpgrade = $state(false);
  let showLimitReached = $state(false);
  let videoMethod = $state<'record' | 'upload'>('record');
  let reviewId = $state<string>('');
  
  
  
  const userPlan = $derived(auth.currentUser?.plan || 'free');
  const reviewCount = $derived(reviewsStore.count);
  const reviewLimit = $derived(getLimit(userPlan as any, 'localReviews'));
  const canCreateReview = $derived(isWithinLimit(reviewCount, reviewLimit));
  const hasAI = $derived(hasFeatureAccess(userPlan as any, 'advancedAI'));
  
  const projects = $derived(projectsStore.data || [
    { id: '1', name: 'My Awesome App' },
    { id: '2', name: 'Backend API' },
    { id: '3', name: 'Mobile App' }
  ]);
  
  const languages = [
    'javascript', 'typescript', 'python', 'java', 'go', 
    'rust', 'php', 'ruby', 'c', 'cpp', 'csharp', 'html', 'css'
  ];
  
  async function generateAISummary() {
    if (!hasAI) {
      showPaywall = true;
      return;
    }
    
    loading = true;
    try {
      // TODO: Call Gemini API
      await new Promise(resolve => setTimeout(resolve, 1500));
      aiSummary = 'This code implements JWT-based authentication for the API endpoints. Key changes include adding token generation, validation middleware, and secure session management.';
      
      // Track AI usage
      await aiUsageStore.create({
        userId: auth.currentUser?.id,
        reviewId: null,
        feature: 'summary',
        tokensUsed: 150,
        success: true
      });
    } catch (error) {
      toast.error('Failed to generate AI summary');
    } finally {
      loading = false;
    }
  }
  
  async function saveDraft() {
    try {
      if (!reviewId) {
        // Create a new draft review
        const draft = await reviewsStore.create({
          title: title || 'Untitled Review',
          description,
          projectId,
          authorId: auth.currentUser?.id || '',
          codeContent: code,
          codeLanguage: language,
          videoUrl: null,
          videoSize: null,
          videoDuration: null,
          thumbnailUrl: null,
          shareToken: crypto.randomUUID(),
          isPublic: false,
          status: 'draft',
          aiSummary,
          metadata: null,
        });
        reviewId = draft.id;
      } else {
        // Update existing draft
        await reviewsStore.update(reviewId, {
          title,
          description,
          codeContent: code,
          codeLanguage: language,
          aiSummary,
        });
      }
      toast.success('Draft saved');
    } catch (error) {
      toast.error('Failed to save draft');
    }
  }
  
  async function publishReview() {
    if (!canCreateReview) {
      showLimitReached = true;
      return;
    }
    
    try {
      if (reviewId) {
        // Update existing draft to published
        await reviewsStore.update(reviewId, {
          status: 'published',
          title,
          description,
          codeContent: code,
          codeLanguage: language,
          aiSummary,
        });
      } else {
        // Create new published review
        await reviewsStore.create({
          title,
          description,
          projectId,
          authorId: auth.currentUser?.id || '',
          codeContent: code,
          codeLanguage: language,
          videoUrl: null,
          videoSize: null,
          videoDuration: null,
          thumbnailUrl: null,
          shareToken: crypto.randomUUID(),
          isPublic: false,
          status: 'published',
          aiSummary,
          metadata: null,
        });
      }
      
      toast.success('Review published!');
      goto('/reviews');
    } catch (error) {
      toast.error('Failed to publish review');
    }
  }
</script>

<AuthGuard requireAuth requirePlan="free">
{#if !canCreateReview}
  <div class="max-w-4xl mx-auto space-y-6 py-8">
    <LimitReached 
      type="cloud-reviews" 
      current={reviewCount} 
      limit={reviewLimit}
      onUpgrade={() => showUpgrade = true}
    />
  </div>
{:else}
<div class="max-w-4xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <Button variant="ghost" size="icon" href="/dashboard">
      <ArrowLeft class="h-5 w-5" />
    </Button>
    <div class="flex-1">
      <h1 class="text-3xl font-bold">Create Review</h1>
      <p class="text-muted-foreground">Walk through your code changes</p>
    </div>
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <div class="flex gap-1">
        {#each Array(3) as _, i}
          <div class="h-2 w-2 rounded-full {i < step ? 'bg-primary' : 'bg-muted'}"></div>
        {/each}
      </div>
      <span>Step {step} of 3</span>
    </div>
  </div>

  {#if step === 1}
    <!-- Step 1: Basic Information -->
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Give your review a title and description</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="title">Review Title</Label>
          <Input
            id="title"
            placeholder="Add user authentication"
            bind:value={title}
            required
          />
        </div>
        
        <div class="space-y-2">
          <Label for="description">Description (optional)</Label>
          <Textarea
            id="description"
            placeholder="Implemented JWT-based authentication..."
            rows={3}
            bind:value={description}
          />
        </div>
        
        <div class="space-y-2">
          <Label for="project">Project</Label>
          <Select type="single" bind:value={projectId}>
            <SelectTrigger>
              {projects.find(p => p.id === projectId)?.name || "Select project"}
            </SelectTrigger>
            <SelectContent>
              {#each projects as project}
                <SelectItem value={project.id}>{project.name}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
        
        <div class="flex justify-end gap-2 pt-4">
          <Button variant="outline" onclick={saveDraft}>
            <Save class="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onclick={() => step = 2} disabled={!title}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}

  {#if step === 2}
    <!-- Step 2: Add Code -->
    <Card>
      <CardHeader>
        <CardTitle>Add Code</CardTitle>
        <CardDescription>Add the code you want to review</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value="paste" class="w-full">
          <TabsList class="grid w-full grid-cols-4">
            <TabsTrigger value="paste">Paste</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
            <TabsTrigger value="git">Local Git</TabsTrigger>
          </TabsList>
          
          <TabsContent value="paste" class="space-y-4">
            <div class="space-y-2">
              <Label>Language</Label>
              <Select bind:value={language}>
                <SelectTrigger>
                  {language || "Auto-detect"}
                </SelectTrigger>
                <SelectContent>
                  {#each languages as lang}
                    <SelectItem value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  {/each}
                </SelectContent>
              </Select>
            </div>
            
            <CodeEditor
              bind:value={code}
              language={language}
              readonly={false}
              showLineNumbers={true}
            />
          </TabsContent>
          
          <TabsContent value="upload" class="space-y-4">
            <div class="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p class="text-sm text-muted-foreground mb-2">
                Drag & drop files or click to browse
              </p>
              <Button variant="outline" size="sm">Choose Files</Button>
              <p class="text-xs text-muted-foreground mt-2">
                Supports .js, .ts, .py, .diff, .patch and more
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="github">
            <div class="space-y-4">
              <Button variant="outline" class="w-full gap-2">
                <Github class="h-4 w-4" />
                Connect GitHub
              </Button>
              <p class="text-sm text-muted-foreground text-center">
                Connect your GitHub account to import pull requests
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="git">
            <div class="space-y-4">
              <Button variant="outline" class="w-full gap-2">
                <FolderGit2 class="h-4 w-4" />
                Browse Local Repository
              </Button>
              <p class="text-sm text-muted-foreground text-center">
                Select a local git repository to import changes
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div class="flex justify-between gap-2 pt-4">
          <Button variant="ghost" onclick={() => step = 1}>
            Back
          </Button>
          <div class="flex gap-2">
            <Button variant="outline" onclick={saveDraft}>
              <Save class="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onclick={() => step = 3} disabled={!code}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  {/if}

  {#if step === 3}
    <!-- Step 3: Add Video -->
    <div class="grid gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Video Walkthrough</CardTitle>
            <CardDescription>Record or upload a video explaining the changes</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <Tabs bind:value={videoMethod} class="w-full">
              <TabsList class="grid w-full grid-cols-2">
                <TabsTrigger value="record">Record</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="record" class="space-y-4">
                <MediaRecorder
                  onRecordingComplete={(blob, thumb) => {
                    videoBlob = blob;
                    thumbnail = thumb;
                  }}
                  maxDuration={600}
                  quality="high"
                />
              </TabsContent>
              
              <TabsContent value="upload" class="space-y-4">
                {#if reviewId}
                  <VideoUploader
                    reviewId={reviewId}
                    onUploadComplete={(result) => {
                      toast.success('Video uploaded successfully!');
                      // You can handle the uploaded video URL here if needed
                    }}
                  />
                {:else}
                  <div class="text-center py-8 text-muted-foreground">
                    <p>Save draft first to enable video upload</p>
                  </div>
                {/if}
              </TabsContent>
            </Tabs>
            
            <div class="flex justify-between gap-2 pt-4">
              <Button variant="ghost" onclick={() => step = 2}>
                Back
              </Button>
              <div class="flex gap-2">
                <Button variant="outline" onclick={saveDraft}>
                  <Save class="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onclick={publishReview} disabled={!videoBlob && videoMethod === 'record'}>
                  Publish Review
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <!-- AI Panel -->
      <div class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Sparkles class="h-5 w-5 text-primary" />
              AI Features
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button
              variant="outline"
              class="w-full justify-start"
              onclick={generateAISummary}
              disabled={loading || !code}
            >
              {loading ? 'Generating...' : 'Generate Summary'}
            </Button>
            
            {#if aiSummary}
              <div class="rounded-lg bg-muted p-3 text-sm">
                <p class="font-medium mb-1">AI Summary:</p>
                <p class="text-muted-foreground">{aiSummary}</p>
              </div>
            {/if}
            
            <Button variant="outline" class="w-full justify-start" disabled={!code}>
              Explain Code
            </Button>
            <Button variant="outline" class="w-full justify-start" disabled={!code}>
              Detect Code Smells
            </Button>
            <Button variant="outline" class="w-full justify-start" disabled={!code}>
              Suggest Improvements
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  {/if}
</div>
{/if}
</AuthGuard>

<PaywallDialog
  bind:open={showPaywall}
  feature="Advanced AI Features"
  requiredPlan="pro"
  onUpgrade={() => showUpgrade = true}
/>

<UpgradeDialog bind:open={showUpgrade} currentPlan={userPlan as any} />
