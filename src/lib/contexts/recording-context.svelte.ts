/**
 * Recording Context - Persists recording state and browser MediaRecorder across component navigation
 * Uses Svelte's context API with $state runes for reactivity
 */

import { getContext, setContext } from 'svelte';

const RECORDING_CONTEXT_KEY = Symbol('recording-context');

export class RecordingContext {
    // Recording state
    isRecording = $state(false);
    isPaused = $state(false);
    recordingTime = $state(0);
    recordingStartTime = $state(0);
    recordingEvents = $state<{ type: string; time: number; scrollTop: number }[]>([]);

    // Video output state
    videoBlob = $state<Blob | null>(null);
    recordedVideoUrl = $state('');
    thumbnail = $state('');
    videoDuration = $state(0);
    showPreviewModal = $state(false);

    // Browser MediaRecorder and Streams (persisted across component mounts)
    mediaRecorder: MediaRecorder | null = null;
    stream: MediaStream | null = null;
    webcamStream: MediaStream | null = null;
    canvasStream: MediaStream | null = null;
    recordedChunks: Blob[] = [];

    // Recording interval
    private recordingInterval: number | null = null;

    // Canvas for compositing (persisted)
    canvasRef: HTMLCanvasElement | null = null;
    canvasCtx: CanvasRenderingContext2D | null = null;

    startTimer() {
        if (this.recordingInterval) return;
        this.recordingInterval = window.setInterval(() => {
            if (!this.isPaused) {
                this.recordingTime++;
            }
        }, 1000);
    }

    stopTimer() {
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }
    }

    startRecording() {
        this.isRecording = true;
        this.isPaused = false;
        this.recordingStartTime = Date.now();
        this.recordingEvents = [];
        this.recordingTime = 0;
        this.recordedChunks = [];
        this.startTimer();
    }

    pauseRecording() {
        if (this.isRecording && !this.isPaused) {
            this.isPaused = true;
            if (this.mediaRecorder?.state === 'recording') {
                this.mediaRecorder.pause();
            }
        }
    }

    resumeRecording() {
        if (this.isRecording && this.isPaused) {
            this.isPaused = false;
            if (this.mediaRecorder?.state === 'paused') {
                this.mediaRecorder.resume();
            }
        }
    }

    stopRecording() {
        if (this.isRecording) {
            this.isRecording = false;
            this.isPaused = false;
            this.stopTimer();

            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
            }
        }
    }

    setMediaRecorder(recorder: MediaRecorder | null) {
        this.mediaRecorder = recorder;
    }

    setStreams(stream: MediaStream | null, webcam: MediaStream | null, canvas: MediaStream | null) {
        this.stream = stream;
        this.webcamStream = webcam;
        this.canvasStream = canvas;
    }

    addChunk(chunk: Blob) {
        this.recordedChunks.push(chunk);
    }

    setVideoOutput(output: {
        videoBlob: Blob;
        recordedVideoUrl: string;
        thumbnail: string;
        videoDuration: number;
    }) {
        this.videoBlob = output.videoBlob;
        this.recordedVideoUrl = output.recordedVideoUrl;
        this.thumbnail = output.thumbnail;
        this.videoDuration = output.videoDuration;
        this.showPreviewModal = true;
    }

    addRecordingEvent(event: { type: string; scrollTop: number }) {
        if (this.isRecording) {
            this.recordingEvents.push({
                ...event,
                time: Date.now() - this.recordingStartTime
            });
        }
    }

    cleanup() {
        this.stopTimer();
        this.stream?.getTracks().forEach(t => t.stop());
        this.webcamStream?.getTracks().forEach(t => t.stop());
        this.canvasStream?.getTracks().forEach(t => t.stop());
        this.mediaRecorder = null;
        this.stream = null;
        this.webcamStream = null;
        this.canvasStream = null;
    }

    reset() {
        this.cleanup();
        this.isRecording = false;
        this.isPaused = false;
        this.recordingTime = 0;
        this.recordingStartTime = 0;
        this.recordingEvents = [];
        this.videoBlob = null;
        this.recordedVideoUrl = '';
        this.thumbnail = '';
        this.videoDuration = 0;
        this.showPreviewModal = false;
        this.recordedChunks = [];
    }

    // Check if we have an active recording session
    hasActiveSession(): boolean {
        return this.mediaRecorder !== null && this.mediaRecorder.state !== 'inactive';
    }
}

export function createRecordingContext(): RecordingContext {
    const context = new RecordingContext();
    setContext(RECORDING_CONTEXT_KEY, context);
    return context;
}

export function getRecordingContext(): RecordingContext | undefined {
    return getContext<RecordingContext>(RECORDING_CONTEXT_KEY);
}

export function hasRecordingContext(): boolean {
    try {
        return !!getContext<RecordingContext>(RECORDING_CONTEXT_KEY);
    } catch {
        return false;
    }
}
