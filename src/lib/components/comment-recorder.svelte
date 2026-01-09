<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { toast } from 'svelte-sonner';
  import Mic from '@lucide/svelte/icons/mic';
  import Video from '@lucide/svelte/icons/video';
  import Square from '@lucide/svelte/icons/square';
  import X from '@lucide/svelte/icons/x';
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import { uploadVideo as uploadVideoForm } from '$lib/video.remote';

  interface Props {
    onRecordingComplete: (media: { type: 'video' | 'audio'; url: string; metadata?: any }) => void;
    onCancel: () => void;
  }

  let { onRecordingComplete, onCancel }: Props = $props();

  let isRecording = $state(false);
  let recordingType = $state<'video' | 'audio' | null>(null);
  let mediaRecorder = $state<MediaRecorder | null>(null);
  let recordedChunks: Blob[] = [];
  let recordingTime = $state(0);
  let timerInterval: number;
  let stream = $state<MediaStream | null>(null);
  let videoPreview = $state<HTMLVideoElement | null>(null);
  let isUploading = $state(false);

  // Use the same action as video-uploader
  const uploadVideo = uploadVideoForm.for('comment-recorder');
  let uploadButton: HTMLButtonElement | null = $state(null);
  // We need a unique ID for the upload logic, simple random string
  const tempId = Math.random().toString(36).substring(7);

  async function startRecording(type: 'video' | 'audio') {
    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (type === 'video' && videoPreview) {
        videoPreview.srcObject = stream;
        videoPreview.play();
      }

      mediaRecorder = new MediaRecorder(stream);
      recordedChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.start();
      isRecording = true;
      recordingType = type;

      timerInterval = window.setInterval(() => {
        recordingTime++;
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      toast.error('Could not access microphone/camera');
    }
  }

  async function stopRecording() {
    if (!mediaRecorder) return;

    mediaRecorder.onstop = async () => {
      stopStream();
      clearInterval(timerInterval);
      isRecording = false;
      isUploading = true;

      try {
        const mimeType = recordingType === 'video' ? 'video/webm' : 'audio/webm';
        const blob = new Blob(recordedChunks, { type: mimeType });
        const file = new File([blob], `comment-${recordingType}-${Date.now()}.webm`, { type: mimeType });

        // Upload logic
        // We set the file value on the hidden form field function
        uploadVideo.fields.video.value = () => file;

        // Programmatically submit the form
        if (uploadButton) {
           uploadButton.click();
           const result = await uploadVideo.result;

           if (result.success && result.videoUrl) {
             onRecordingComplete({
               type: recordingType || 'video',
               url: result.videoUrl,
               metadata: result.metadata
             });
           } else {
             throw new Error('Upload failed');
           }
        }
      } catch (err) {
        console.error('Upload error:', err);
        toast.error('Failed to upload recording');
      } finally {
        isUploading = false;
        recordingType = null;
      }
    };

    mediaRecorder.stop();
  }

  function cancelRecording() {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
    }
    stopStream();
    clearInterval(timerInterval);
    onCancel();
  }

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<div class="p-4 border rounded-lg bg-muted/20 space-y-4">
  {#if !recordingType}
    <div class="flex items-center gap-4 justify-center">
      <Button variant="outline" onclick={() => startRecording('audio')}>
        <Mic class="mr-2 h-4 w-4" />
        Record Voice
      </Button>
      <Button variant="outline" onclick={() => startRecording('video')}>
        <Video class="mr-2 h-4 w-4" />
        Record Video
      </Button>
      <Button variant="ghost" size="icon" onclick={onCancel}>
        <X class="h-4 w-4" />
      </Button>
    </div>
  {:else}
    <div class="space-y-4">
      {#if recordingType === 'video'}
        <div class="relative bg-black rounded-lg overflow-hidden aspect-video max-w-sm mx-auto">
          <video bind:this={videoPreview} class="w-full h-full object-cover" muted playsinline></video>
        </div>
      {/if}

      <div class="flex items-center justify-center gap-4">
        {#if isUploading}
           <div class="flex items-center gap-2 text-sm text-muted-foreground">
             <Loader2 class="h-4 w-4 animate-spin" />
             Uploading...
           </div>
        {:else}
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span class="font-mono text-sm">{formatTime(recordingTime)}</span>
          </div>

          <Button variant="destructive" size="sm" onclick={stopRecording}>
            <Square class="mr-2 h-4 w-4" />
            Stop
          </Button>

          <Button variant="ghost" size="sm" onclick={cancelRecording}>
            Cancel
          </Button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Hidden form for upload -->
<form {...uploadVideo} class="hidden" enctype="multipart/form-data">
	<input {...uploadVideo.fields.video.as('file')} />
	<input {...uploadVideo.fields.reviewId.as('text')} value="inline-comment-{tempId}" />
  <!-- We assume 'local' or 'cloud' depending on default config or pass it if needed -->
	<button bind:this={uploadButton} {...uploadVideo.buttonProps}></button>
</form>
