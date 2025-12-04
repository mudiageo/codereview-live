<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardContent } from '$lib/components/ui/card';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '$lib/components/ui/select';
  import Circle from '@lucide/svelte/icons/circle';
  import Square from '@lucide/svelte/icons/square';
  import Video from '@lucide/svelte/icons/video';
  import Pause from '@lucide/svelte/icons/pause';
  import Play from '@lucide/svelte/icons/play';
  
  interface Props {
    onRecordingComplete?: (blob: Blob) => void;
    maxDuration?: number;
  }
  
  let {
    onRecordingComplete,
    maxDuration = 600 // 10 minutes default
  }: Props = $props();
  
  let isRecording = $state(false);
  let isPaused = $state(false);
  let recordingTime = $state(0);
  let mediaRecorder = $state<MediaRecorder | null>(null);
  let recordedChunks = $state<Blob[]>([]);
  let videoBlob = $state<Blob | null>(null);
  let stream = $state<MediaStream | null>(null);
  let recordingInterval: number;
  let selectedSource = $state('screen');
  
  async function startRecording() {
    try {
      // Request screen/video capture
      if (selectedSource === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' as any },
          audio: true
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      }
      
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks = [...recordedChunks, event.data];
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        videoBlob = blob;
        onRecordingComplete?.(blob);
        
        // Stop all tracks
        stream?.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      isRecording = true;
      recordingTime = 0;
      
      recordingInterval = window.setInterval(() => {
        recordingTime++;
        if (recordingTime >= maxDuration) {
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please ensure you have granted camera/screen permissions.');
    }
  }
  
  function pauseRecording() {
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.pause();
      isPaused = true;
      clearInterval(recordingInterval);
    }
  }
  
  function resumeRecording() {
    if (mediaRecorder?.state === 'paused') {
      mediaRecorder.resume();
      isPaused = false;
      
      recordingInterval = window.setInterval(() => {
        recordingTime++;
        if (recordingTime >= maxDuration) {
          stopRecording();
        }
      }, 1000);
    }
  }
  
  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      isRecording = false;
      isPaused = false;
      clearInterval(recordingInterval);
    }
  }
  
  function resetRecording() {
    videoBlob = null;
    recordedChunks = [];
    recordingTime = 0;
  }
  
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  $effect(() => {
    return () => {
      clearInterval(recordingInterval);
      stream?.getTracks().forEach(track => track.stop());
    };
  });
</script>

<Card>
  <CardContent class="p-6 space-y-4">
    <!-- Preview Area -->
    <div class="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
      {#if !isRecording && !videoBlob}
        <div class="text-center">
          <Video class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p class="text-sm text-muted-foreground mb-4">
            Select a source and click start to begin recording
          </p>
        </div>
      {:else if isRecording}
        <div class="text-center">
          <div class="relative mb-4">
            <Circle class="h-20 w-20 text-video-recording {isPaused ? '' : 'animate-pulse'}" />
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="h-10 w-10 rounded-full {isPaused ? 'bg-muted' : 'bg-video-recording'}"></div>
            </div>
          </div>
          <p class="text-3xl font-mono font-bold mb-2">{formatTime(recordingTime)}</p>
          <Badge variant={isPaused ? 'secondary' : 'destructive'} class={isPaused ? '' : 'animate-pulse'}>
            {isPaused ? 'Paused' : 'Recording'}
          </Badge>
        </div>
      {:else if videoBlob}
        <div class="text-center">
          <Video class="h-16 w-16 mx-auto text-primary mb-4" />
          <p class="text-lg font-semibold mb-2">Recording Complete!</p>
          <p class="text-sm text-muted-foreground mb-2">
            Duration: {formatTime(recordingTime)}
          </p>
          <p class="text-xs text-muted-foreground">
            Size: {(videoBlob.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      {/if}
    </div>
    
    <!-- Source Selection -->
    {#if !isRecording && !videoBlob}
      <div class="space-y-2">
        <label class="text-sm font-medium">Recording Source</label>
        <Select bind:value={selectedSource}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="screen">Screen</SelectItem>
            <SelectItem value="camera">Camera</SelectItem>
          </SelectContent>
        </Select>
      </div>
    {/if}
    
    <!-- Controls -->
    <div class="flex items-center justify-center gap-2">
      {#if !isRecording && !videoBlob}
        <Button onclick={startRecording} size="lg" class="gap-2">
          <Circle class="h-5 w-5" />
          Start Recording
        </Button>
      {:else if isRecording}
        <Button
          onclick={isPaused ? resumeRecording : pauseRecording}
          size="lg"
          variant="secondary"
          class="gap-2"
        >
          {#if isPaused}
            <Play class="h-5 w-5" />
            Resume
          {:else}
            <Pause class="h-5 w-5" />
            Pause
          {/if}
        </Button>
        <Button onclick={stopRecording} size="lg" variant="destructive" class="gap-2">
          <Square class="h-5 w-5" />
          Stop
        </Button>
      {:else if videoBlob}
        <Button variant="outline" onclick={resetRecording}>
          Record Again
        </Button>
        <Button>
          Use This Recording
        </Button>
      {/if}
    </div>
    
    {#if isRecording}
      <p class="text-xs text-center text-muted-foreground">
        Maximum duration: {formatTime(maxDuration)}
      </p>
    {/if}
  </CardContent>
</Card>