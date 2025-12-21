<script lang="ts">
  import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import Play from '@lucide/svelte/icons/play';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import Save from '@lucide/svelte/icons/save';
  import X from '@lucide/svelte/icons/x';

  interface Props {
    open: boolean;
    videoUrl: string;
    onSave: (metadata: VideoMetadata) => void;
    onReRecord: () => void;
    onDiscard: () => void;
  }

  export interface VideoMetadata {
    title: string;
    description: string;
    trimStart: number;
    trimEnd: number;
  }

  let { open = $bindable(), videoUrl, onSave, onReRecord, onDiscard }: Props = $props();

  let videoElement: HTMLVideoElement;
  let title = $state('');
  let description = $state('');
  let trimStart = $state(0);
  let trimEnd = $state(0);
  let videoDuration = $state(0);

  function handleVideoLoad() {
    if (videoElement) {
      videoDuration = videoElement.duration;
      trimEnd = videoDuration;
    }
  }

  function handleSave() {
    onSave({
      title,
      description,
      trimStart,
      trimEnd
    });
    open = false;
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
      </div>
    </div>

    <DialogFooter class="gap-2">
      <Button variant="outline" onclick={handleDiscard}>
        <X class="mr-2 h-4 w-4" />
        Discard
      </Button>
      <Button variant="outline" onclick={handleReRecord}>
        <RotateCcw class="mr-2 h-4 w-4" />
        Re-record
      </Button>
      <Button onclick={handleSave}>
        <Save class="mr-2 h-4 w-4" />
        Save Video
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
