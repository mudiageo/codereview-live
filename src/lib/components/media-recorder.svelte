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
  
  import AnnotationToolbar from './annotation-toolbar.svelte';
  import VideoPreviewModal from './video-preview-modal.svelte';

  interface Props {
    onRecordingComplete?: (blob: Blob, thumbnail: string) => void;
    onStart?: () => void;
    maxDuration?: number;
    quality?: 'low' | 'medium' | 'high';
  }
  
  let {
    onRecordingComplete,
    onStart,
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
  let isToolbarVisible = $state(true);

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
          video: { width: 1280, height: 720 },
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
        
        // Add microphone audio if requested
        if (includeMicAudio) {

           const micStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId: audioSource !== 'default' ? { exact: audioSource } : undefined,
                echoCancellation: true,
                noiseSuppression: true,
              }
           });

           // Mix audio tracks
           const audioContext = new AudioContext();
           const destination = audioContext.createMediaStreamDestination();

           stream.getAudioTracks().forEach(track => {
            const source = audioContext.createMediaStreamSource(new MediaStream([track]));
              source.connect(destination);
            });
            
           micStream.getAudioTracks().forEach(t => audioContext.createMediaStreamSource(new MediaStream([t])).connect(destination));
           
            // Replace audio track
           stream.getAudioTracks().forEach(track => track.stop());
           destination.stream.getAudioTracks().forEach(track => stream!.addTrack(track));
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

        // Generate thumbnail
         thumbnail = await generateThumbnail(blob);

        // Compress if needed
        if (quality !== 'high' && blob.size > 10 * 1024 * 1024) { // > 10MB
          toast.promise(
            compressVideo(blob),
            {
              loading: 'Compressing video...',
              success: (compressed) => {
                videoBlob = compressed;
                return `Compressed from ${(blob.size / 1024 / 1024).toFixed(1)}MB to ${(compressed.size / 1024 / 1024).toFixed(1)}MB`;
              },
              error: 'Compression failed, using original'
            }
          ).then(compressed => {
            videoBlob = compressed;
          }).catch(() => {
            videoBlob = blob;
          });
        } else {
          videoBlob = blob;
        }

         recordedVideoUrl = URL.createObjectURL(blob);

         // Get duration for preview
         const tempVideo = document.createElement('video');
         tempVideo.src = recordedVideoUrl;
         await new Promise(r => { tempVideo.onloadedmetadata = () => { videoDuration = tempVideo.duration; r(null); }});

         // Show Preview Modal
         showPreviewModal = true;
         
         // Stop all tracks
         stream?.getTracks().forEach(t => t.stop());
         webcamStream?.getTracks().forEach(t => t.stop());
      };
      
      mediaRecorder.start(1000);
      isRecording = true;
      recordingTime = 0;
      onStart?.();
      
      recordingInterval = window.setInterval(() => {
        recordingTime++;
        if (recordingTime >= maxDuration) {
          stopRecording();          
          toast.warning('Maximum recording duration reached');
          }
      }, 1000);
      
    } catch (error: any) {
      console.error('Error starting recording:', error);

      if (error.name === 'NotAllowedError') {
        toast.error('Camera/screen permission denied. Please allow access and try again.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera or screen capture device found.');
      } else {
        toast.error('Failed to start recording: ' + error.message);
      }
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
    thumbnail = '';
    recordedChunks = [];
    recordingTime = 0;
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
  
  async function compressVideo(blob: Blob): Promise<Blob> {
    isCompressing = true;
    compressionProgress = 0;

    try {
      const ffmpeg = new FFmpeg();

      ffmpeg.on('progress', ({ progress }) => {
        compressionProgress = Math.round(progress * 100);
      });

      await ffmpeg.load();

      const inputName = 'input.webm';
      const outputName = 'output.mp4';

      await ffmpeg.writeFile(inputName, await fetchFile(blob));

      // Compress with h264 codec
      await ffmpeg.exec([
        '-i', inputName,
        '-c:v', 'libx264',
        '-crf', '28',
        '-preset', 'fast',
        '-c:a', 'aac',
        '-b:a', '128k',
        outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      return new Blob([data], { type: 'video/mp4' });
    } finally {
      isCompressing = false;
      compressionProgress = 0;
    }
    
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
      const video = document.createElement('video');
      video.src = URL.createObjectURL(blob);

      video.addEventListener('loadeddata', () => {
        video.currentTime = Math.min(2, video.duration / 2);
      });

      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
        URL.revokeObjectURL(video.src);
      });
    });
  }
  
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
   }

  function handleUseRecording() {
    if (videoBlob && thumbnail) {
      onRecordingComplete?.(videoBlob, thumbnail);
     }
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
              visible={isToolbarVisible}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < annotationHistory.length - 1}
              onUndo={() => { /* Undo logic */ }}
              onRedo={() => { /* Redo logic */ }}
              onClear={() => ctx?.clearRect(0, 0, canvasRef.width, canvasRef.height)}
              onToolChange={(tool) => currentTool = tool}
              onToggleVisibility={() => isToolbarVisible = !isToolbarVisible}
           />
        </div>

        <div class="absolute top-4 left-4 flex items-center gap-2 bg-black/80 px-3 py-2 rounded-lg z-20">
          <div class="h-3 w-3 rounded-full {isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}"></div>
          <span class="text-white font-mono text-sm">{formatTime(recordingTime)}</span>
          <span class="text-white/60 text-xs">/ {formatTime(maxDuration)}</span>
        </div>
        
        {#if isPaused}
          <div class="absolute inset-0 flex items-center justify-center bg-black/40">
            <Badge variant="secondary" class="text-lg px-4 py-2">Paused</Badge>
          </div>
        {/if}
      {:else if videoBlob}
        <!-- Video Preview -->
        <video
          src={URL.createObjectURL(videoBlob)}
          class="w-full h-full object-contain"
          controls
        ><track kind="captions"></video>
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
            {#if selectedSource !== 'camera'}
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label>Include Webcam (Picture-in-Picture)</Label>
                  <p class="text-sm text-muted-foreground">Show your webcam in corner</p>
                </div>
                <Switch bind:checked={includeWebcam} />
              </div>
            {/if}

            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>System Audio</Label>
                <p class="text-sm text-muted-foreground">Record computer audio</p>
              </div>
              <Switch bind:checked={includeSystemAudio} />
            </div>
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Microphone Audio</Label>
                <p class="text-sm text-muted-foreground">Record your voice</p>
              </div>
              <Switch bind:checked={includeMicAudio} />
            </div>
            <div class="space-y-2">
              <Label>Countdown Duration</Label>
              <Select type="single" bind:value={countdownDuration}>
                <SelectTrigger>
                  {countdownDuration || ""}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={0}>No countdown</SelectItem>
                  <SelectItem value={3}>3 seconds</SelectItem>
                  <SelectItem value={5}>5 seconds</SelectItem>
                  <SelectItem value={10}>10 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Compression Progress -->
    {#if isCompressing}
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span>Compressing video...</span>
          <span>{compressionProgress}%</span>
        </div>
        <div class="h-2 bg-muted rounded-full overflow-hidden">
          <div
            class="h-full bg-primary transition-all duration-300"
            style="width: {compressionProgress}%"
          ></div>
        </div>
      </div>
    {/if}

    <!-- Controls -->
    <div class="flex items-center justify-center gap-2">
      {#if !isRecording && !videoBlob && countdown === 0}
        <Button onclick={startRecording} size="lg" class="gap-2">
          <Circle class="h-5 w-5" />
          Start Recording
        </Button>
      {:else if countdown > 0}
        <Button
          onclick={() => {
            clearInterval(countdownInterval);
            countdown = 0;
          }}
          size="lg"
          variant="outline"
        >
          Cancel
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
        <Button onclick={handleUseRecording}>
          Use This Recording
        </Button>
        <Button onclick={stopRecording} size="lg" variant="destructive">
           <Square class="h-5 w-5" /> Stop
        </Button>
      {/if}
    </div>
    {#if videoBlob}
      <div class="text-sm text-center text-muted-foreground">
        Duration: {formatTime(recordingTime)} • Size: {(videoBlob.size / 1024 / 1024).toFixed(2)} MB
      </div>
    {/if}
  </CardContent>
</Card>

{#if showPreviewModal}
  <VideoPreviewModal
     bind:open={showPreviewModal}
     videoUrl={recordedVideoUrl}
     duration={videoDuration}
     onSave={handleSaveVideo}
     onReRecord={() => { handleDiscard(); startRecording(); }}
     onDiscard={handleDiscard}
  />
{/if}