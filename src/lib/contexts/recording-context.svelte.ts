/**
 * Recording Context - Persists recording state across component navigation
 * Uses Svelte's context API with $state runes for reactivity
 */

import { getContext, setContext } from 'svelte';

const RECORDING_CONTEXT_KEY = Symbol('recording-context');

export interface RecordingState {
    isRecording: boolean;
    isPaused: boolean;
    recordingTime: number;
    recordingStartTime: number;
    recordingEvents: { type: string; time: number; scrollTop: number }[];
    videoBlob: Blob | null;
    recordedVideoUrl: string;
    thumbnail: string;
    videoDuration: number;
    showPreviewModal: boolean;
}

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

    // MediaRecorder reference for external control
    private mediaRecorder: MediaRecorder | null = null;
    private recordingInterval: number | null = null;

    // Callbacks
    private onStartCallback?: () => void;
    private onEndCallback?: () => void;
    private onPauseCallback?: () => void;
    private onResumeCallback?: () => void;

    setCallbacks(callbacks: {
        onStart?: () => void;
        onEnd?: () => void;
        onPause?: () => void;
        onResume?: () => void;
    }) {
        this.onStartCallback = callbacks.onStart;
        this.onEndCallback = callbacks.onEnd;
        this.onPauseCallback = callbacks.onPause;
        this.onResumeCallback = callbacks.onResume;
    }

    startRecording() {
        this.isRecording = true;
        this.isPaused = false;
        this.recordingStartTime = Date.now();
        this.recordingEvents = [];
        this.recordingTime = 0;

        // Start timer
        this.recordingInterval = window.setInterval(() => {
            if (!this.isPaused) {
                this.recordingTime++;
            }
        }, 1000);

        this.onStartCallback?.();
    }

    pauseRecording() {
        if (this.isRecording && !this.isPaused) {
            this.isPaused = true;
            if (this.mediaRecorder?.state === 'recording') {
                this.mediaRecorder.pause();
            }
            this.onPauseCallback?.();
        }
    }

    resumeRecording() {
        if (this.isRecording && this.isPaused) {
            this.isPaused = false;
            if (this.mediaRecorder?.state === 'paused') {
                this.mediaRecorder.resume();
            }
            this.onResumeCallback?.();
        }
    }

    stopRecording() {
        if (this.isRecording) {
            this.isRecording = false;
            this.isPaused = false;

            if (this.recordingInterval) {
                clearInterval(this.recordingInterval);
                this.recordingInterval = null;
            }

            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
            }

            this.onEndCallback?.();
        }
    }

    setMediaRecorder(recorder: MediaRecorder | null) {
        this.mediaRecorder = recorder;
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

    reset() {
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

        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }
    }

    getState(): RecordingState {
        return {
            isRecording: this.isRecording,
            isPaused: this.isPaused,
            recordingTime: this.recordingTime,
            recordingStartTime: this.recordingStartTime,
            recordingEvents: this.recordingEvents,
            videoBlob: this.videoBlob,
            recordedVideoUrl: this.recordedVideoUrl,
            thumbnail: this.thumbnail,
            videoDuration: this.videoDuration,
            showPreviewModal: this.showPreviewModal
        };
    }
}

export function createRecordingContext(): RecordingContext {
    const context = new RecordingContext();
    setContext(RECORDING_CONTEXT_KEY, context);
    return context;
}

export function getRecordingContext(): RecordingContext {
    const context = getContext<RecordingContext>(RECORDING_CONTEXT_KEY);
    if (!context) {
        throw new Error('RecordingContext not found. Make sure to call createRecordingContext() in a parent component.');
    }
    return context;
}

export function hasRecordingContext(): boolean {
    try {
        return !!getContext<RecordingContext>(RECORDING_CONTEXT_KEY);
    } catch {
        return false;
    }
}
