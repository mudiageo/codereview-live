<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Progress } from '$lib/components/ui/progress';
  import { uploadVideo } from '$lib/video.remote';
  import { toast } from 'svelte-sonner';
  import Upload from '@lucide/svelte/icons/upload';
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
  
  interface Props {
    reviewId: string;
    onUploadComplete?: (result: { videoUrl: string; thumbnailUrl?: string }) => void;
  }
  
  let { reviewId, onUploadComplete }: Props = $props();
  
  let uploading = $state(false);
  let progress = $state(0);
  let videoFile = $state<File | null>(null);
  let uploadComplete = $state(false);
  
  async function handleUpload() {
    if (!videoFile) return;
    
    uploading = true;
    progress = 0;
    
    try {
      // Simulate progress (in real app, use XMLHttpRequest for progress events)
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + 10, 90);
      }, 500);
      
      const result = await uploadVideo({ video: videoFile, reviewId });
      
      clearInterval(progressInterval);
      progress = 100;
      uploadComplete = true;
      
      toast.success('Video uploaded successfully!');
      onUploadComplete?.(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      uploading = false;
    }
  }
  
  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      videoFile = input.files[0];
      uploadComplete = false;
      progress = 0;
    }
  }
</script>

<div class="space-y-4">
  {#if !uploadComplete}
    <label
      for="video-upload"
      class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
    >
      <div class="flex flex-col items-center justify-center pt-5 pb-6">
        <Upload class="w-10 h-10 mb-3 text-muted-foreground" />
        <p class="mb-2 text-sm text-muted-foreground">
          <span class="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p class="text-xs text-muted-foreground">MP4, WebM or MOV (MAX. 500MB)</p>
      </div>
      <input
        id="video-upload"
        type="file"
        accept="video/*"
        class="hidden"
        onchange={handleFileSelect}
        disabled={uploading}
      />
    </label>
  {:else}
    <div class="flex items-center justify-center p-8 border-2 border-dashed rounded-lg bg-primary/5">
      <CheckCircle2 class="w-12 h-12 text-primary" />
      <p class="ml-3 text-lg font-medium">Upload Complete!</p>
    </div>
  {/if}
  
  {#if videoFile && !uploadComplete}
    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="truncate">{videoFile.name}</span>
        <span>{(videoFile.size / 1024 / 1024).toFixed(2)} MB</span>
      </div>
      
      {#if uploading}
        <Progress value={progress} class="h-2" />
        <p class="text-xs text-center text-muted-foreground">{progress}% uploaded</p>
      {:else}
        <Button onclick={handleUpload} class="w-full">
          Upload Video
        </Button>
      {/if}
    </div>
  {/if}
</div>