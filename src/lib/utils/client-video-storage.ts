/**
 * Client-Side Video Storage Service
 * 
 * Provides a comprehensive client-side video storage solution with browser API 
 * fallback chain for cross-browser support.
 * 
 * Priority: tauri > opfs > filesystem > indexeddb
 */

export type StorageMode = 'client' | 'cloud' | 'hybrid';
export type ClientStorageBackend = 'indexeddb' | 'opfs' | 'filesystem' | 'tauri';

export interface VideoMetadata {
    id: string;
    title: string;
    description?: string;
    reviewId: string;
    duration: number;
    size: number;
    mimeType: string;
    createdAt: Date;
    thumbnailDataUrl?: string;
    syncStatus?: 'pending' | 'synced' | 'failed';
}

export interface VideoEntry {
    id: string;
    metadata: VideoMetadata;
    backend: ClientStorageBackend;
}

export interface StorageInfo {
    backend: ClientStorageBackend;
    usedBytes: number;
    availableBytes: number;
    quotaBytes: number;
    percentUsed: number;
}

export interface ClientVideoStorage {
    save(video: Blob, metadata: Omit<VideoMetadata, 'id' | 'createdAt' | 'size'>): Promise<string>;
    get(id: string): Promise<{ blob: Blob; metadata: VideoMetadata } | null>;
    delete(id: string): Promise<void>;
    list(): Promise<VideoEntry[]>;
    getStorageInfo(): Promise<StorageInfo>;
    getBackend(): ClientStorageBackend;
}

// ============================================================================
// IndexedDB Backend
// ============================================================================

const DB_NAME = 'codereview-video-storage';
const DB_VERSION = 1;
const VIDEO_STORE = 'videos';
const METADATA_STORE = 'metadata';

class IndexedDBVideoStorage implements ClientVideoStorage {
    private db: IDBDatabase | null = null;

    async initialize(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create videos store for blob data
                if (!db.objectStoreNames.contains(VIDEO_STORE)) {
                    db.createObjectStore(VIDEO_STORE, { keyPath: 'id' });
                }

                // Create metadata store with indexes
                if (!db.objectStoreNames.contains(METADATA_STORE)) {
                    const metadataStore = db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
                    metadataStore.createIndex('reviewId', 'reviewId', { unique: false });
                    metadataStore.createIndex('createdAt', 'createdAt', { unique: false });
                    metadataStore.createIndex('syncStatus', 'syncStatus', { unique: false });
                }
            };
        });
    }

    async save(video: Blob, metadata: Omit<VideoMetadata, 'id' | 'createdAt' | 'size'>): Promise<string> {
        await this.initialize();

        const id = crypto.randomUUID();
        const fullMetadata: VideoMetadata = {
            ...metadata,
            id,
            size: video.size,
            createdAt: new Date(),
            syncStatus: 'pending'
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([VIDEO_STORE, METADATA_STORE], 'readwrite');

            transaction.onerror = () => reject(transaction.error);

            // Store the video blob
            const videoStore = transaction.objectStore(VIDEO_STORE);
            videoStore.put({ id, blob: video });

            // Store the metadata
            const metadataStore = transaction.objectStore(METADATA_STORE);
            metadataStore.put(fullMetadata);

            transaction.oncomplete = () => resolve(id);
        });
    }

    async get(id: string): Promise<{ blob: Blob; metadata: VideoMetadata } | null> {
        await this.initialize();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([VIDEO_STORE, METADATA_STORE], 'readonly');

            transaction.onerror = () => reject(transaction.error);

            const videoStore = transaction.objectStore(VIDEO_STORE);
            const metadataStore = transaction.objectStore(METADATA_STORE);

            const videoRequest = videoStore.get(id);
            const metadataRequest = metadataStore.get(id);

            transaction.oncomplete = () => {
                if (!videoRequest.result || !metadataRequest.result) {
                    resolve(null);
                    return;
                }

                resolve({
                    blob: videoRequest.result.blob,
                    metadata: metadataRequest.result
                });
            };
        });
    }

    async delete(id: string): Promise<void> {
        await this.initialize();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([VIDEO_STORE, METADATA_STORE], 'readwrite');

            transaction.onerror = () => reject(transaction.error);

            transaction.objectStore(VIDEO_STORE).delete(id);
            transaction.objectStore(METADATA_STORE).delete(id);

            transaction.oncomplete = () => resolve();
        });
    }

    async list(): Promise<VideoEntry[]> {
        await this.initialize();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(METADATA_STORE, 'readonly');
            const store = transaction.objectStore(METADATA_STORE);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const entries: VideoEntry[] = request.result.map((metadata: VideoMetadata) => ({
                    id: metadata.id,
                    metadata,
                    backend: 'indexeddb' as ClientStorageBackend
                }));
                resolve(entries);
            };
        });
    }

    async getStorageInfo(): Promise<StorageInfo> {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                const usedBytes = estimate.usage || 0;
                const quotaBytes = estimate.quota || 0;

                return {
                    backend: 'indexeddb',
                    usedBytes,
                    availableBytes: quotaBytes - usedBytes,
                    quotaBytes,
                    percentUsed: quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0
                };
            }
        } catch (e) {
            console.warn('Storage estimation failed:', e);
        }

        // Fallback for browsers without Storage API
        return {
            backend: 'indexeddb',
            usedBytes: 0,
            availableBytes: 50 * 1024 * 1024, // Assume 50MB free
            quotaBytes: 50 * 1024 * 1024,
            percentUsed: 0
        };
    }

    getBackend(): ClientStorageBackend {
        return 'indexeddb';
    }
}

// ============================================================================
// Origin Private File System (OPFS) Backend
// ============================================================================

class OPFSVideoStorage implements ClientVideoStorage {
    private root: FileSystemDirectoryHandle | null = null;
    private videosDir: FileSystemDirectoryHandle | null = null;
    private metadataDir: FileSystemDirectoryHandle | null = null;

    async initialize(): Promise<void> {
        if (this.root) return;

        this.root = await navigator.storage.getDirectory();
        this.videosDir = await this.root.getDirectoryHandle('videos', { create: true });
        this.metadataDir = await this.root.getDirectoryHandle('metadata', { create: true });
    }

    async save(video: Blob, metadata: Omit<VideoMetadata, 'id' | 'createdAt' | 'size'>): Promise<string> {
        await this.initialize();

        const id = crypto.randomUUID();
        const fullMetadata: VideoMetadata = {
            ...metadata,
            id,
            size: video.size,
            createdAt: new Date(),
            syncStatus: 'pending'
        };

        // Save video file
        const videoHandle = await this.videosDir!.getFileHandle(`${id}.webm`, { create: true });
        const writable = await videoHandle.createWritable();
        await writable.write(video);
        await writable.close();

        // Save metadata file
        const metadataHandle = await this.metadataDir!.getFileHandle(`${id}.json`, { create: true });
        const metadataWritable = await metadataHandle.createWritable();
        await metadataWritable.write(JSON.stringify(fullMetadata));
        await metadataWritable.close();

        return id;
    }

    async get(id: string): Promise<{ blob: Blob; metadata: VideoMetadata } | null> {
        await this.initialize();

        try {
            // Get video file
            const videoHandle = await this.videosDir!.getFileHandle(`${id}.webm`);
            const videoFile = await videoHandle.getFile();

            // Get metadata file
            const metadataHandle = await this.metadataDir!.getFileHandle(`${id}.json`);
            const metadataFile = await metadataHandle.getFile();
            const metadataText = await metadataFile.text();
            const metadata = JSON.parse(metadataText);

            return { blob: videoFile, metadata };
        } catch {
            return null;
        }
    }

    async delete(id: string): Promise<void> {
        await this.initialize();

        try {
            await this.videosDir!.removeEntry(`${id}.webm`);
        } catch { /* File may not exist */ }

        try {
            await this.metadataDir!.removeEntry(`${id}.json`);
        } catch { /* File may not exist */ }
    }

    async list(): Promise<VideoEntry[]> {
        await this.initialize();

        const entries: VideoEntry[] = [];

        for await (const entry of (this.metadataDir as any).values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                try {
                    const file = await entry.getFile();
                    const text = await file.text();
                    const metadata = JSON.parse(text);
                    entries.push({
                        id: metadata.id,
                        metadata,
                        backend: 'opfs'
                    });
                } catch (e) {
                    console.warn('Failed to read metadata file:', entry.name, e);
                }
            }
        }

        return entries;
    }

    async getStorageInfo(): Promise<StorageInfo> {
        try {
            const estimate = await navigator.storage.estimate();
            const usedBytes = estimate.usage || 0;
            const quotaBytes = estimate.quota || 0;

            return {
                backend: 'opfs',
                usedBytes,
                availableBytes: quotaBytes - usedBytes,
                quotaBytes,
                percentUsed: quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0
            };
        } catch {
            return {
                backend: 'opfs',
                usedBytes: 0,
                availableBytes: 0,
                quotaBytes: 0,
                percentUsed: 0
            };
        }
    }

    getBackend(): ClientStorageBackend {
        return 'opfs';
    }
}

// ============================================================================
// FileSystem Access API Backend (User-granted filesystem access)
// ============================================================================

class FileSystemVideoStorage implements ClientVideoStorage {
    private directoryHandle: FileSystemDirectoryHandle | null = null;

    async requestDirectory(): Promise<boolean> {
        try {
            this.directoryHandle = await (window as any).showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'videos'
            });
            return true;
        } catch {
            return false;
        }
    }

    hasAccess(): boolean {
        return this.directoryHandle !== null;
    }

    async save(video: Blob, metadata: Omit<VideoMetadata, 'id' | 'createdAt' | 'size'>): Promise<string> {
        if (!this.directoryHandle) {
            throw new Error('No directory access. Call requestDirectory() first.');
        }

        const id = crypto.randomUUID();
        const fullMetadata: VideoMetadata = {
            ...metadata,
            id,
            size: video.size,
            createdAt: new Date(),
            syncStatus: 'pending'
        };

        // Create video file
        const videoHandle = await this.directoryHandle.getFileHandle(`${id}.webm`, { create: true });
        const writable = await videoHandle.createWritable();
        await writable.write(video);
        await writable.close();

        // Create metadata file
        const metadataHandle = await this.directoryHandle.getFileHandle(`${id}.json`, { create: true });
        const metadataWritable = await metadataHandle.createWritable();
        await metadataWritable.write(JSON.stringify(fullMetadata, null, 2));
        await metadataWritable.close();

        return id;
    }

    async get(id: string): Promise<{ blob: Blob; metadata: VideoMetadata } | null> {
        if (!this.directoryHandle) return null;

        try {
            const videoHandle = await this.directoryHandle.getFileHandle(`${id}.webm`);
            const videoFile = await videoHandle.getFile();

            const metadataHandle = await this.directoryHandle.getFileHandle(`${id}.json`);
            const metadataFile = await metadataHandle.getFile();
            const metadata = JSON.parse(await metadataFile.text());

            return { blob: videoFile, metadata };
        } catch {
            return null;
        }
    }

    async delete(id: string): Promise<void> {
        if (!this.directoryHandle) return;

        try {
            await this.directoryHandle.removeEntry(`${id}.webm`);
        } catch { /* ignore */ }

        try {
            await this.directoryHandle.removeEntry(`${id}.json`);
        } catch { /* ignore */ }
    }

    async list(): Promise<VideoEntry[]> {
        if (!this.directoryHandle) return [];

        const entries: VideoEntry[] = [];

        for await (const entry of (this.directoryHandle as any).values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                try {
                    const file = await entry.getFile();
                    const metadata = JSON.parse(await file.text());
                    entries.push({
                        id: metadata.id,
                        metadata,
                        backend: 'filesystem'
                    });
                } catch { /* skip invalid files */ }
            }
        }

        return entries;
    }

    async getStorageInfo(): Promise<StorageInfo> {
        // FileSystem Access API doesn't provide quota information
        return {
            backend: 'filesystem',
            usedBytes: 0,
            availableBytes: Infinity,
            quotaBytes: Infinity,
            percentUsed: 0
        };
    }

    getBackend(): ClientStorageBackend {
        return 'filesystem';
    }
}

// ============================================================================
// Tauri Backend (Native filesystem for desktop app)
// ============================================================================

class TauriVideoStorage implements ClientVideoStorage {
    private basePath: string | null = null;

    async initialize(): Promise<void> {
        if (this.basePath) return;

        // @ts-ignore - Tauri API
        const { appDataDir, join } = await import('@tauri-apps/api/path');
        const baseDir = await appDataDir();
        // @ts-ignore - Tauri API
        const { createDir, exists } = await import('@tauri-apps/api/fs');

        this.basePath = await join(baseDir, 'videos');

        if (!(await exists(this.basePath))) {
            await createDir(this.basePath, { recursive: true });
        }
    }

    async save(video: Blob, metadata: Omit<VideoMetadata, 'id' | 'createdAt' | 'size'>): Promise<string> {
        await this.initialize();

        // @ts-ignore - Tauri API
        const { writeBinaryFile, writeTextFile } = await import('@tauri-apps/api/fs');
        // @ts-ignore - Tauri API
        const { join } = await import('@tauri-apps/api/path');

        const id = crypto.randomUUID();
        const fullMetadata: VideoMetadata = {
            ...metadata,
            id,
            size: video.size,
            createdAt: new Date(),
            syncStatus: 'pending'
        };

        const videoPath = await join(this.basePath!, `${id}.webm`);
        const metadataPath = await join(this.basePath!, `${id}.json`);

        // Convert blob to array buffer
        const arrayBuffer = await video.arrayBuffer();

        await writeBinaryFile(videoPath, new Uint8Array(arrayBuffer));
        await writeTextFile(metadataPath, JSON.stringify(fullMetadata, null, 2));

        return id;
    }

    async get(id: string): Promise<{ blob: Blob; metadata: VideoMetadata } | null> {
        await this.initialize();

        try {
            // @ts-ignore - Tauri API
            const { readBinaryFile, readTextFile } = await import('@tauri-apps/api/fs');
            // @ts-ignore - Tauri API
            const { join } = await import('@tauri-apps/api/path');

            const videoPath = await join(this.basePath!, `${id}.webm`);
            const metadataPath = await join(this.basePath!, `${id}.json`);

            const videoData = await readBinaryFile(videoPath);
            const metadataText = await readTextFile(metadataPath);

            return {
                blob: new Blob([videoData], { type: 'video/webm' }),
                metadata: JSON.parse(metadataText)
            };
        } catch {
            return null;
        }
    }

    async delete(id: string): Promise<void> {
        await this.initialize();

        // @ts-ignore - Tauri API
        const { removeFile } = await import('@tauri-apps/api/fs');
        // @ts-ignore - Tauri API
        const { join } = await import('@tauri-apps/api/path');

        try {
            await removeFile(await join(this.basePath!, `${id}.webm`));
        } catch { /* ignore */ }

        try {
            await removeFile(await join(this.basePath!, `${id}.json`));
        } catch { /* ignore */ }
    }

    async list(): Promise<VideoEntry[]> {
        await this.initialize();

        // @ts-ignore - Tauri API
        const { readDir, readTextFile } = await import('@tauri-apps/api/fs');
        // @ts-ignore - Tauri API
        const { join } = await import('@tauri-apps/api/path');

        const entries: VideoEntry[] = [];
        const files = await readDir(this.basePath!);

        for (const file of files) {
            if (file.name?.endsWith('.json')) {
                try {
                    const metadataPath = await join(this.basePath!, file.name);
                    const metadata = JSON.parse(await readTextFile(metadataPath));
                    entries.push({
                        id: metadata.id,
                        metadata,
                        backend: 'tauri'
                    });
                } catch { /* skip invalid */ }
            }
        }

        return entries;
    }

    async getStorageInfo(): Promise<StorageInfo> {
        // Tauri doesn't have a built-in storage quota API
        return {
            backend: 'tauri',
            usedBytes: 0,
            availableBytes: Infinity,
            quotaBytes: Infinity,
            percentUsed: 0
        };
    }

    getBackend(): ClientStorageBackend {
        return 'tauri';
    }
}

// ============================================================================
// Backend Detection and Factory
// ============================================================================

async function isTauriAvailable(): Promise<boolean> {
    try {
        // @ts-ignore
        return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
    } catch {
        return false;
    }
}

function isOPFSAvailable(): boolean {
    return typeof navigator !== 'undefined' &&
        'storage' in navigator &&
        'getDirectory' in navigator.storage;
}

function isFileSystemAccessAvailable(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

function isIndexedDBAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
}

export async function detectAvailableBackends(): Promise<ClientStorageBackend[]> {
    const backends: ClientStorageBackend[] = [];

    if (await isTauriAvailable()) {
        backends.push('tauri');
    }

    if (isOPFSAvailable()) {
        backends.push('opfs');
    }

    if (isFileSystemAccessAvailable()) {
        backends.push('filesystem');
    }

    if (isIndexedDBAvailable()) {
        backends.push('indexeddb');
    }

    return backends;
}

export async function createClientVideoStorage(
    preferredBackend?: ClientStorageBackend
): Promise<ClientVideoStorage> {
    const available = await detectAvailableBackends();

    // Use preferred backend if available
    if (preferredBackend && available.includes(preferredBackend)) {
        return createStorageForBackend(preferredBackend);
    }

    // Otherwise use first available (priority order)
    const backend = available[0] || 'indexeddb';
    return createStorageForBackend(backend);
}

function createStorageForBackend(backend: ClientStorageBackend): ClientVideoStorage {
    switch (backend) {
        case 'tauri':
            return new TauriVideoStorage();
        case 'opfs':
            return new OPFSVideoStorage();
        case 'filesystem':
            return new FileSystemVideoStorage();
        case 'indexeddb':
        default:
            return new IndexedDBVideoStorage();
    }
}

// ============================================================================
// Cloud Sync Queue for Hybrid Mode
// ============================================================================

interface SyncQueueItem {
    videoId: string;
    reviewId: string;
    addedAt: Date;
    retryCount: number;
}

class CloudSyncQueue {
    private queue: SyncQueueItem[] = [];
    private isProcessing = false;
    private storage: ClientVideoStorage | null = null;

    async initialize(storage: ClientVideoStorage) {
        this.storage = storage;
        await this.loadQueue();
    }

    private async loadQueue() {
        // Load pending sync items from localStorage
        try {
            const saved = localStorage.getItem('video-sync-queue');
            if (saved) {
                this.queue = JSON.parse(saved);
            }
        } catch { /* ignore */ }
    }

    private saveQueue() {
        try {
            localStorage.setItem('video-sync-queue', JSON.stringify(this.queue));
        } catch { /* ignore */ }
    }

    add(videoId: string, reviewId: string) {
        this.queue.push({
            videoId,
            reviewId,
            addedAt: new Date(),
            retryCount: 0
        });
        this.saveQueue();
        this.processQueue();
    }

    async processQueue() {
        if (this.isProcessing || !this.storage || this.queue.length === 0) return;

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const item = this.queue[0];

            try {
                const video = await this.storage.get(item.videoId);
                if (!video) {
                    // Video no longer exists, remove from queue
                    this.queue.shift();
                    continue;
                }

                // TODO: Implement actual cloud upload
                // const result = await uploadVideo({ video: video.blob, reviewId: item.reviewId, storageProvider: 'cloud' });

                // For now, just mark as synced
                console.log(`[CloudSync] Would sync video ${item.videoId} to cloud`);

                // Remove from queue on success
                this.queue.shift();
                this.saveQueue();

            } catch (error) {
                console.error('[CloudSync] Failed to sync video:', error);

                // Increment retry count and move to end of queue
                item.retryCount++;

                if (item.retryCount >= 3) {
                    // Give up after 3 retries
                    this.queue.shift();
                } else {
                    this.queue.push(this.queue.shift()!);
                }

                this.saveQueue();
                break; // Wait before retrying
            }
        }

        this.isProcessing = false;
    }
}

export const cloudSyncQueue = new CloudSyncQueue();

// ============================================================================
// Utility Functions
// ============================================================================

export function formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes === Infinity) return 'Unlimited';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export function getBackendDisplayName(backend: ClientStorageBackend): string {
    switch (backend) {
        case 'tauri': return 'Native Filesystem';
        case 'opfs': return 'Origin Private File System';
        case 'filesystem': return 'User Filesystem';
        case 'indexeddb': return 'Browser Storage (IndexedDB)';
        default: return 'Unknown';
    }
}
