<script lang="ts">
  import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { toast } from 'svelte-sonner';
  import Play from '@lucide/svelte/icons/play';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import Save from '@lucide/svelte/icons/save';
  import UploadCloud from '@lucide/svelte/icons/upload-cloud';
  import X from '@lucide/svelte/icons/x';
  import { uploadVideo } from '$lib/video.remote';
  import { settingsStore } from '$lib/stores/index.svelte';

  interface Props {
    open: boolean;
    videoUrl: string;
    reviewId: string;
    onSave: (metadata: VideoMetadata & { videoUrl: string; thumbnailUrl: string; metadata: any }) => void;
    onReRecord: () => void;
    onDiscard: () => void;
  }

  export interface VideoMetadata {
    title: string;
    description: string;
    trimStart: number;
    trimEnd: number;
  }

  let { open = $bindable(), videoUrl, reviewId, onSave, onReRecord, onDiscard }: Props = $props();

  let videoElement: HTMLVideoElement;
  let title = $state('');
  let description = $state('');
  let trimStart = $state(0);
  let trimEnd = $state(0);
  let videoDuration = $state(0);
  let storageProvider = $state<'local' | 'cloud'>(settingsStore.settings.storageProvider || 'local');
  let isUploading = $state(false);

  function handleVideoLoad() {
    if (videoElement) {
      videoDuration = videoElement.duration;
      trimEnd = videoDuration;
    }
  }

  async function handleSave() {
    if (!reviewId) {
      toast.error('Cannot save video without a review ID');
      return;
    }

    isUploading = true;
    try {
      // Fetch blob from URL
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const file = new File([blob], 'recording.webm', { type: 'video/webm' });

      const result = await uploadVideo({
        video: file,
        reviewId,
        storageProvider
      });

      if (result.success && result.videoUrl) {
        onSave({
          title,
          description,
          trimStart,
          trimEnd,
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl || '',
          metadata: result.metadata
        });
        toast.success('Video uploaded successfully');
        open = false;
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload video');
    } finally {
      isUploading = false;
    }
  }

  function handleReRecord() {
    onReRecord();
    open = false;
  }

  function handleDiscard() {
    onDiscard();
    open = false;
  }
</script>

<Dialog bind:open>
  <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Preview & Save Video</DialogTitle>
    </DialogHeader>

    <div class="space-y-4">
      <!-- Video Preview -->
      <div class="relative bg-black rounded-lg overflow-hidden">
        <video
          bind:this={videoElement}
          src={videoUrl}
          controls
          class="w-full"
          onloadedmetadata={handleVideoLoad}
        />
      </div>

      <!-- Metadata -->
      <div class="space-y-4">
        <div>
          <Label for="title">Video Title</Label>
          <Input
            id="title"
            bind:value={title}
            placeholder="Enter video title"
          />
        </div>

        <div>
          <Label for="description">Description</Label>
          <Textarea
            id="description"
            bind:value={description}
            placeholder="Add description (optional)"
            rows={3}
          />
        </div>

        <!-- Trim Controls (Optional) -->
        {#if videoDuration > 0}
          <div class="space-y-2">
            <Label>Trim Video (Optional)</Label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label for="trimStart" class="text-xs">Start (seconds)</Label>
                <Input
                  id="trimStart"
                  type="number"
                  bind:value={trimStart}
                  min={0}
                  max={videoDuration}
                  step={0.1}
                />
              </div>
              <div>
                <Label for="trimEnd" class="text-xs">End (seconds)</Label>
                <Input
                  id="trimEnd"
                  type="number"
                  bind:value={trimEnd}
                  min={0}
                  max={videoDuration}
                  step={0.1}
                />
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              Duration: {(trimEnd - trimStart).toFixed(1)}s / {videoDuration.toFixed(1)}s
            </p>
          </div>
        {/if}

        <!-- Storage Selection -->
        <div class="space-y-2">
          <Label>Storage Location</Label>
          <Select type="single" bind:value={storageProvider}>
            <SelectTrigger>
              {storageProvider === 'local' ? 'Local Storage' : 'Cloud Storage'}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local Storage</SelectItem>
              <SelectItem value="cloud">Cloud Storage (S3/R2)</SelectItem>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            {storageProvider === 'local'
              ? 'Video will be stored on your local server disk.'
              : 'Video will be uploaded to configured cloud storage.'}
          </p>
        </div>
      </div>
    </div>

    <DialogFooter class="gap-2">
      <Button variant="outline" onclick={handleDiscard} disabled={isUploading}>
        <X class="mr-2 h-4 w-4" />
        Discard
      </Button>
      <Button variant="outline" onclick={handleReRecord} disabled={isUploading}>
        <RotateCcw class="mr-2 h-4 w-4" />
        Re-record
      </Button>
      <Button onclick={handleSave} disabled={isUploading}>
        {#if isUploading}
          <UploadCloud class="mr-2 h-4 w-4 animate-bounce" />
          Uploading...
        {:else}
          <Save class="mr-2 h-4 w-4" />
          Save & Upload
        {/if}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
