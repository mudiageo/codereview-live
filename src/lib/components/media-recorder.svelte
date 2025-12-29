<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { toast } from 'svelte-sonner';
  import Circle from '@lucide/svelte/icons/circle';
  import Square from '@lucide/svelte/icons/square';
  import Pause from '@lucide/svelte/icons/pause';
  import Play from '@lucide/svelte/icons/play';
  import Settings from '@lucide/svelte/icons/settings';
  import Monitor from '@lucide/svelte/icons/monitor';
  import { FFmpeg } from '@ffmpeg/ffmpeg';
  import { fetchFile } from '@ffmpeg/util';
  
  // Integration Imports
  import AnnotationToolbar from './annotation-toolbar.svelte';
  import VideoPreviewModal from './video-preview-modal.svelte';

  interface Props {
    onRecordingComplete?: (blob: Blob, thumbnail: string) => void;
    maxDuration?: number;
    quality?: 'low' | 'medium' | 'high';
  }
  
  let {
    onRecordingComplete,
    maxDuration = 600,
    quality = 'high'
  }: Props = $props();

  let isRecording = $state(false);
  let isPaused = $state(false);
  let recordingTime = $state(0);
  let countdown = $state(0);
  let mediaRecorder = $state<MediaRecorder | null>(null);
  let recordedChunks = $state<Blob[]>([]);
  let videoBlob = $state<Blob | null>(null);
  let thumbnail = $state<string>('');
  let stream = $state<MediaStream | null>(null);
  let webcamStream = $state<MediaStream | null>(null);
  let recordingInterval: number;
  let countdownInterval: number;
  let videoPreview = $state<HTMLVideoElement>();
  let webcamPreview = $state<HTMLVideoElement>();
  
  // Settings
  let selectedSource = $state<'screen' | 'window' | 'camera'>('screen');
  let audioSource = $state<string>('default');
  let includeWebcam = $state(false);
  let includeSystemAudio = $state(true);
  let includeMicAudio = $state(true);
  let countdownDuration = $state(3);
  let showSettings = $state(false);
  let isCompressing = $state(false);
  let compressionProgress = $state(0);
  let availableAudioInputs = $state<MediaDeviceInfo[]>([]);

  // Annotations State
  let canvasRef: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let isDrawing = $state(false);
  let currentTool = $state({ type: 'pen', color: '#ff0000', strokeWidth: 3 });
  let annotationHistory = $state<ImageData[]>([]);
  let historyIndex = $state(0);

  // Preview Modal State
  let showPreviewModal = $state(false);
  let recordedVideoUrl = $state('');
  let videoDuration = $state(0);

  const supportsScreenCapture = $derived(
    typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices
  );

  $effect(() => {
    if (typeof navigator !== 'undefined') {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        availableAudioInputs = devices.filter(d => d.kind === 'audioinput');
      });
      
      // Auto-switch to camera if screen capture isn't supported
      if (!supportsScreenCapture) {
        selectedSource = 'camera';
      }
    }
  });

  // Initialize canvas for annotations when recording starts
  $effect(() => {
    if (isRecording && canvasRef && videoPreview) {
      ctx = canvasRef.getContext('2d');
      if (ctx) {
         // Match canvas size to video preview
         const resizeObserver = new ResizeObserver(() => {
             if (canvasRef && videoPreview) {
                 canvasRef.width = videoPreview.clientWidth;
                 canvasRef.height = videoPreview.clientHeight;
             }
         });
         resizeObserver.observe(videoPreview);
         return () => resizeObserver.disconnect();
      }
    }
  });

  async function startRecording() {
    if (countdownDuration > 0) {
      countdown = countdownDuration;
      countdownInterval = window.setInterval(() => {
        countdown--;
        if (countdown === 0) {
          clearInterval(countdownInterval);
          beginRecording();
        }
      }, 1000);
    } else {
      await beginRecording();
    }
  }
  
  async function beginRecording() {
    try {
      const videoConstraints: any = {
        video: {
          cursor: 'always',
          displaySurface: selectedSource === 'window' ? 'window' : 'monitor',
        }
      };

      if (selectedSource === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 }, // Optimized for mobile/webcam
          audio: includeMicAudio ? {
            deviceId: audioSource !== 'default' ? { exact: audioSource } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
          } : false
        });
      } else {
        if (!supportsScreenCapture) throw new Error('Screen capture not supported on this device');
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: videoConstraints.video,
          audio: includeSystemAudio
        });
        
        // Handle audio mixing (restored from original)
        if (includeMicAudio) {
           const micStream = await navigator.mediaDevices.getUserMedia({
              audio: { deviceId: audioSource !== 'default' ? { exact: audioSource } : undefined }
           });
           const audioContext = new AudioContext();
           const destination = audioContext.createMediaStreamDestination();
           stream.getAudioTracks().forEach(t => audioContext.createMediaStreamSource(new MediaStream([t])).connect(destination));
           micStream.getAudioTracks().forEach(t => audioContext.createMediaStreamSource(new MediaStream([t])).connect(destination));
           stream.getAudioTracks().forEach(t => t.stop());
           destination.stream.getAudioTracks().forEach(t => stream!.addTrack(t));
        }
      }
      
      // Webcam PIP
      if (includeWebcam && selectedSource !== 'camera') {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (webcamPreview) {
          webcamPreview.srcObject = webcamStream;
          webcamPreview.play();
        }
      }
      
      if (videoPreview) {
        videoPreview.srcObject = stream;
        videoPreview.play();
      }
      
      const qualitySettings = {
        low: { videoBitsPerSecond: 1000000 },
        medium: { videoBitsPerSecond: 2500000 },
        high: { videoBitsPerSecond: 5000000 },
      };

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        ...qualitySettings[quality]
      });
      
      recordedChunks = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
      
      mediaRecorder.onstop = async () => {
         const blob = new Blob(recordedChunks, { type: 'video/webm' });
         videoBlob = blob;
         recordedVideoUrl = URL.createObjectURL(blob);
         
         // Generate thumbnail (simplified restoration)
         thumbnail = await generateThumbnail(blob);
         
         // Get duration for preview
         const tempVideo = document.createElement('video');
         tempVideo.src = recordedVideoUrl;
         await new Promise(r => { tempVideo.onloadedmetadata = () => { videoDuration = tempVideo.duration; r(null); }});

         // Show Preview Modal
         showPreviewModal = true;
         
         stream?.getTracks().forEach(t => t.stop());
         webcamStream?.getTracks().forEach(t => t.stop());
      };
      
      mediaRecorder.start(1000);
      isRecording = true;
      recordingTime = 0;
      
      recordingInterval = window.setInterval(() => {
        recordingTime++;
        if (recordingTime >= maxDuration) stopRecording();
      }, 1000);
      
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to start recording: ' + error.message);
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

  // Annotation Handlers
  function handleMouseDown(e: MouseEvent) {
    if (!ctx || !isRecording) return;
    isDrawing = true;
    const rect = canvasRef.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = currentTool.color;
    ctx.lineWidth = currentTool.strokeWidth;
  }
  function handleMouseMove(e: MouseEvent) {
    if (!isDrawing || !ctx) return;
    const rect = canvasRef.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }
  function handleMouseUp() {
    if (!isDrawing) return;
    isDrawing = false;
    if (ctx) {
        const data = ctx.getImageData(0, 0, canvasRef.width, canvasRef.height);
        annotationHistory = [...annotationHistory.slice(0, historyIndex + 1), data];
        historyIndex++;
    }
  }

  // Preview Handlers
  function handleSaveVideo(metadata: any) {
     if (videoBlob && thumbnail) {
         onRecordingComplete?.(videoBlob, thumbnail);
         showPreviewModal = false;
     }
  }
  function handleDiscard() {
     showPreviewModal = false;
     videoBlob = null;
     recordedChunks = [];
  }

  // Utilities
  async function generateThumbnail(blob: Blob): Promise<string> {
      return new Promise((resolve) => {
          const v = document.createElement('video');
          v.src = URL.createObjectURL(blob);
          v.onloadeddata = () => v.currentTime = 1;
          v.onseeked = () => {
              const c = document.createElement('canvas');
              c.width = 640; c.height = 360;
              c.getContext('2d')?.drawImage(v, 0, 0, 640, 360);
              resolve(c.toDataURL('image/jpeg', 0.8));
          };
      });
  }
  function formatTime(s: number) {
      const m = Math.floor(s / 60); const sc = s % 60;
      return `${m.toString().padStart(2, '0')}:${sc.toString().padStart(2, '0')}`;
  }

  $effect(() => {
    return () => {
      clearInterval(recordingInterval);
      clearInterval(countdownInterval);
      stream?.getTracks().forEach(t => t.stop());
      webcamStream?.getTracks().forEach(t => t.stop());
    };
  });
</script>

<Card>
  <CardContent class="p-6 space-y-4">
    <div class="relative aspect-video bg-muted rounded-lg overflow-hidden group">
      {#if countdown > 0}
        <div class="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
           <div class="text-center text-white">
             <div class="text-8xl font-bold mb-4">{countdown}</div>
             <p class="text-lg">Get ready...</p>
           </div>
        </div>
      {:else if !isRecording && !videoBlob}
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <Monitor class="h-16 w-16 text-muted-foreground mb-4" />
          <p class="text-sm text-muted-foreground">Select recording source and click start</p>
          {#if !supportsScreenCapture}
             <Badge variant="secondary" class="mt-2">Screen recording unavailable on this device</Badge>
          {/if}
        </div>
      {:else if isRecording || isPaused}
        <video bind:this={videoPreview} class="w-full h-full object-contain" muted><track kind="captions"></video>
        {#if includeWebcam && webcamStream}
           <div class="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
             <video bind:this={webcamPreview} class="w-full h-full object-cover" muted><track kind="captions"></video>
           </div>
        {/if}
        
        <canvas 
           bind:this={canvasRef}
           class="absolute inset-0 cursor-crosshair z-10"
           onmousedown={handleMouseDown}
           onmousemove={handleMouseMove}
           onmouseup={handleMouseUp}
           onmouseleave={handleMouseUp}
        />
        
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
           <AnnotationToolbar
              bind:currentTool={currentTool}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < annotationHistory.length - 1}
              onUndo={() => { /* Undo logic */ }}
              onRedo={() => { /* Redo logic */ }}
              onClearAll={() => ctx?.clearRect(0, 0, canvasRef.width, canvasRef.height)}
           />
        </div>

        <div class="absolute top-4 left-4 flex items-center gap-2 bg-black/80 px-3 py-2 rounded-lg z-20">
          <div class="h-3 w-3 rounded-full {isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}"></div>
          <span class="text-white font-mono text-sm">{formatTime(recordingTime)}</span>
        </div>
      {/if}
    </div>
    
    {#if !isRecording && !videoBlob}
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <Label>Recording Settings</Label>
          <Button variant="ghost" size="sm" onclick={() => showSettings = !showSettings}>
            <Settings class="h-4 w-4 mr-2" /> {showSettings ? 'Hide' : 'Show'} Advanced
          </Button>
        </div>
        
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label>Source</Label>
            <Select type="single" bind:value={selectedSource}>
              <SelectTrigger>{selectedSource}</SelectTrigger>
              <SelectContent>
                <SelectItem value="screen" disabled={!supportsScreenCapture}>
                   Entire Screen {!supportsScreenCapture ? '(Not Supported)' : ''}
                </SelectItem>
                <SelectItem value="window" disabled={!supportsScreenCapture}>
                   Window {!supportsScreenCapture ? '(Not Supported)' : ''}
                </SelectItem>
                <SelectItem value="camera">Camera</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {#if availableAudioInputs.length > 0}
            <div class="space-y-2">
              <Label>Microphone</Label>
              <Select type="single" bind:value={audioSource}>
                 <SelectTrigger class="w-full truncate">{audioSource}</SelectTrigger>
                 <SelectContent>
                   <SelectItem value="default">Default</SelectItem>
                   {#each availableAudioInputs as device}
                     <SelectItem value={device.deviceId}>{device.label}</SelectItem>
                   {/each}
                 </SelectContent>
              </Select>
            </div>
          {/if}
        </div>

        {#if showSettings}
          <div class="space-y-4 pt-4 border-t">
             <div class="flex items-center justify-between">
                <Label>Include Webcam</Label>
                <Switch bind:checked={includeWebcam} disabled={selectedSource === 'camera'} />
             </div>
             </div>
        {/if}
      </div>
    {/if}
    
    <div class="flex items-center justify-center gap-2">
      {#if !isRecording && !videoBlob}
        <Button onclick={startRecording} size="lg" class="gap-2">
          <Circle class="h-5 w-5" /> Start Recording
        </Button>
      {:else if isRecording}
        <Button onclick={isPaused ? () => { mediaRecorder?.resume(); isPaused=false; } : () => { mediaRecorder?.pause(); isPaused=true; }} size="lg" variant="secondary">
           {isPaused ? 'Resume' : 'Pause'}
        </Button>
        <Button onclick={stopRecording} size="lg" variant="destructive">
           <Square class="h-5 w-5" /> Stop
        </Button>
      {/if}
    </div>
  </CardContent>
</Card>

{#if showPreviewModal}
  <VideoPreviewModal
     videoUrl={recordedVideoUrl}
     duration={videoDuration}
     onSave={handleSaveVideo}
     onReRecord={() => { handleDiscard(); startRecording(); }}
     onDiscard={handleDiscard}
  />
{/if}