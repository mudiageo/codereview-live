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
  
  let step = $state(1);
  let title = $state('');
  let description = $state('');
  let projectId = $state('');
  let code = $state('');
  let language = $state('javascript');
  let isRecording = $state(false);
  let recordingTime = $state(0);
  let videoBlob = $state<Blob | null>(null);
  let aiSummary = $state('');
  let loading = $state(false);
  
  const projects = [
    { id: '1', name: 'My Awesome App' },
    { id: '2', name: 'Backend API' },
    { id: '3', name: 'Mobile App' }
  ];
  
  const languages = [
    'javascript', 'typescript', 'python', 'java', 'go', 
    'rust', 'php', 'ruby', 'c', 'cpp', 'csharp', 'html', 'css'
  ];
  
  let recordingInterval: number;
  
  function startRecording() {
    isRecording = true;
    recordingTime = 0;
    recordingInterval = window.setInterval(() => {
      recordingTime++;
    }, 1000);
    
    // TODO: Implement actual screen recording
    console.log('Starting recording...');
  }
  
  function stopRecording() {
    isRecording = false;
    clearInterval(recordingInterval);
    
    // TODO: Save recorded video
    console.log('Stopping recording...');
  }
  
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  async function generateAISummary() {
    loading = true;
    try {
      // TODO: Call Gemini API
      await new Promise(resolve => setTimeout(resolve, 1500));
      aiSummary = 'This code implements JWT-based authentication for the API endpoints. Key changes include adding token generation, validation middleware, and secure session management.';
    } finally {
      loading = false;
    }
  }
  
  async function saveDraft() {
    // TODO: Save to local storage
    console.log('Saving draft...');
  }
  
  async function publishReview() {
    // TODO: Publish review
    console.log('Publishing review...');
    window.location.href = '/reviews';
  }
</script>

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
          <Select bind:value={projectId}>
            <SelectTrigger>
              {projectId || "Select project"}
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
            
            <Textarea
              placeholder="Paste your code here..."
              rows={15}
              class="font-mono text-sm"
              bind:value={code}
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
    <!-- Step 3: Record Video -->
    <div class="grid gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Video Walkthrough</CardTitle>
            <CardDescription>Record yourself explaining the changes</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- Recording Area -->
            <div class="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
              {#if !isRecording && !videoBlob}
                <div class="text-center">
                  <VideoIcon class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p class="text-sm text-muted-foreground mb-4">
                    Click the button below to start recording
                  </p>
                </div>
              {:else if isRecording}
                <div class="text-center">
                  <div class="relative mb-4">
                    <Circle class="h-16 w-16 text-video-recording animate-pulse" />
                    <div class="absolute inset-0 flex items-center justify-center">
                      <div class="h-8 w-8 rounded-full bg-video-recording"></div>
                    </div>
                  </div>
                  <p class="text-2xl font-mono font-bold mb-2">{formatTime(recordingTime)}</p>
                  <Badge variant="destructive" class="animate-pulse">Recording</Badge>
                </div>
              {:else}
                <div class="text-center">
                  <VideoIcon class="h-12 w-12 mx-auto text-primary mb-4" />
                  <p class="text-sm text-muted-foreground">
                    Recording complete! Preview or re-record.
                  </p>
                </div>
              {/if}
            </div>
            
            <!-- Recording Controls -->
            <div class="flex items-center justify-center gap-2">
              {#if !isRecording && !videoBlob}
                <Button onclick={startRecording} size="lg" class="gap-2">
                  <Circle class="h-5 w-5" />
                  Start Recording
                </Button>
              {:else if isRecording}
                <Button onclick={stopRecording} size="lg" variant="destructive" class="gap-2">
                  <Square class="h-5 w-5" />
                  Stop Recording
                </Button>
              {:else}
                <Button variant="outline" onclick={() => videoBlob = null}>
                  Re-record
                </Button>
              {/if}
            </div>
            
            <div class="flex justify-between gap-2 pt-4">
              <Button variant="ghost" onclick={() => step = 2}>
                Back
              </Button>
              <div class="flex gap-2">
                <Button variant="outline" onclick={saveDraft}>
                  <Save class="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onclick={publishReview} disabled={!videoBlob}>
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