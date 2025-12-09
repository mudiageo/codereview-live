/**
 * Generic local storage API for handling media files (videos, audio, images)
 * Supports multiple backend implementations:
 * - FileSystem API (modern browsers)
 * - IndexedDB (fallback)
 * - Tauri Commands (desktop app)
 * - Custom solutions
 */

export type StorageBackend = 'filesystem' | 'indexeddb' | 'tauri' | 'custom';

export interface StorageConfig {
  backend: StorageBackend;
  maxSize?: number; // Max file size in bytes
  customHandler?: CustomStorageHandler;
}

export interface CustomStorageHandler {
  save: (file: Blob, path: string, metadata?: StorageMetadata) => Promise<string>;
  get: (id: string) => Promise<Blob | null>;
  delete: (id: string) => Promise<void>;
  list: () => Promise<StorageEntry[]>;
}

export interface StorageMetadata {
  filename: string;
  mimeType: string;
  size: number;
  reviewId?: string;
  type?: 'video' | 'audio' | 'image' | 'thumbnail' | 'reply';
  createdAt: Date;
  [key: string]: any;
}

export interface StorageEntry {
  id: string;
  path: string;
  metadata: StorageMetadata;
  url?: string;
}

export class LocalStorageAPI {
  private config: StorageConfig;
  private db: IDBDatabase | null = null;
  private fileSystemHandle: FileSystemDirectoryHandle | null = null;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  /**
   * Initialize storage backend
   */
  async initialize(): Promise<void> {
    switch (this.config.backend) {
      case 'filesystem':
        await this.initFileSystem();
        break;
      case 'indexeddb':
        await this.initIndexedDB();
        break;
      case 'tauri':
        await this.initTauri();
        break;
      case 'custom':
        if (!this.config.customHandler) {
          throw new Error('Custom handler not provided');
        }
        break;
    }
  }

  /**
   * Save a file to storage
   */
  async save(file: Blob, path: string, metadata: Partial<StorageMetadata> = {}): Promise<string> {
    // Validate file size
    if (this.config.maxSize && file.size > this.config.maxSize) {
      throw new Error(`File size exceeds maximum allowed (${this.config.maxSize} bytes)`);
    }

    const fullMetadata: StorageMetadata = {
      filename: path.split('/').pop() || 'file',
      mimeType: file.type,
      size: file.size,
      createdAt: new Date(),
      ...metadata
    };

    const id = this.generateId();

    switch (this.config.backend) {
      case 'filesystem':
        return await this.saveToFileSystem(file, path, id, fullMetadata);
      case 'indexeddb':
        return await this.saveToIndexedDB(file, path, id, fullMetadata);
      case 'tauri':
        return await this.saveToTauri(file, path, id, fullMetadata);
      case 'custom':
        if (!this.config.customHandler) {
          throw new Error('Custom handler not provided');
        }
        return await this.config.customHandler.save(file, path, fullMetadata);
    }
  }

  /**
   * Retrieve a file from storage
   */
  async get(id: string): Promise<{ blob: Blob; metadata: StorageMetadata; url?: string } | null> {
    switch (this.config.backend) {
      case 'filesystem':
        return await this.getFromFileSystem(id);
      case 'indexeddb':
        return await this.getFromIndexedDB(id);
      case 'tauri':
        return await this.getFromTauri(id);
      case 'custom':
        if (!this.config.customHandler) {
          throw new Error('Custom handler not provided');
        }
        const blob = await this.config.customHandler.get(id);
        return blob ? { blob, metadata: { filename: id, mimeType: blob.type, size: blob.size, createdAt: new Date() } } : null;
    }
  }

  /**
   * Delete a file from storage
   */
  async delete(id: string): Promise<void> {
    switch (this.config.backend) {
      case 'filesystem':
        await this.deleteFromFileSystem(id);
        break;
      case 'indexeddb':
        await this.deleteFromIndexedDB(id);
        break;
      case 'tauri':
        await this.deleteFromTauri(id);
        break;
      case 'custom':
        if (!this.config.customHandler) {
          throw new Error('Custom handler not provided');
        }
        await this.config.customHandler.delete(id);
        break;
    }
  }

  /**
   * List all stored files
   */
  async list(): Promise<StorageEntry[]> {
    switch (this.config.backend) {
      case 'filesystem':
        return await this.listFromFileSystem();
      case 'indexeddb':
        return await this.listFromIndexedDB();
      case 'tauri':
        return await this.listFromTauri();
      case 'custom':
        if (!this.config.customHandler) {
          throw new Error('Custom handler not provided');
        }
        return await this.config.customHandler.list();
    }
  }

  /**
   * Get a URL for a stored file (for video/audio playback)
   */
  async getURL(id: string): Promise<string | null> {
    const result = await this.get(id);
    if (!result) return null;

    if (result.url) {
      return result.url;
    }

    // Create object URL for blob
    return URL.createObjectURL(result.blob);
  }

  /**
   * Clear all stored files
   */
  async clear(): Promise<void> {
    switch (this.config.backend) {
      case 'filesystem':
        await this.clearFileSystem();
        break;
      case 'indexeddb':
        await this.clearIndexedDB();
        break;
      case 'tauri':
        await this.clearTauri();
        break;
      case 'custom':
        const entries = await this.list();
        for (const entry of entries) {
          await this.delete(entry.id);
        }
        break;
    }
  }

  // FileSystem API implementation
  private async initFileSystem(): Promise<void> {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('FileSystem API not supported');
    }

    try {
      // @ts-ignore - FileSystem API
      this.fileSystemHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
    } catch (error) {
      throw new Error('Failed to initialize FileSystem API');
    }
  }

  private async saveToFileSystem(
    file: Blob,
    path: string,
    id: string,
    metadata: StorageMetadata
  ): Promise<string> {
    if (!this.fileSystemHandle) {
      throw new Error('FileSystem not initialized');
    }

    try {
      // Create file in directory
      const fileHandle = await this.fileSystemHandle.getFileHandle(id, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      // Save metadata
      const metadataHandle = await this.fileSystemHandle.getFileHandle(`${id}.meta.json`, { create: true });
      const metadataWritable = await metadataHandle.createWritable();
      await metadataWritable.write(JSON.stringify(metadata));
      await metadataWritable.close();

      return id;
    } catch (error) {
      throw new Error('Failed to save file to FileSystem');
    }
  }

  private async getFromFileSystem(id: string): Promise<{ blob: Blob; metadata: StorageMetadata; url?: string } | null> {
    if (!this.fileSystemHandle) {
      throw new Error('FileSystem not initialized');
    }

    try {
      const fileHandle = await this.fileSystemHandle.getFileHandle(id);
      const file = await fileHandle.getFile();

      const metadataHandle = await this.fileSystemHandle.getFileHandle(`${id}.meta.json`);
      const metadataFile = await metadataHandle.getFile();
      const metadataText = await metadataFile.text();
      const metadata = JSON.parse(metadataText);

      return { blob: file, metadata };
    } catch (error) {
      return null;
    }
  }

  private async deleteFromFileSystem(id: string): Promise<void> {
    if (!this.fileSystemHandle) {
      throw new Error('FileSystem not initialized');
    }

    try {
      await this.fileSystemHandle.removeEntry(id);
      await this.fileSystemHandle.removeEntry(`${id}.meta.json`);
    } catch (error) {
      console.error('Failed to delete from FileSystem:', error);
    }
  }

  private async listFromFileSystem(): Promise<StorageEntry[]> {
    if (!this.fileSystemHandle) {
      throw new Error('FileSystem not initialized');
    }

    const entries: StorageEntry[] = [];

    // @ts-ignore
    for await (const entry of this.fileSystemHandle.values()) {
      if (entry.kind === 'file' && !entry.name.endsWith('.meta.json')) {
        try {
          const metadataHandle = await this.fileSystemHandle.getFileHandle(`${entry.name}.meta.json`);
          const metadataFile = await metadataHandle.getFile();
          const metadataText = await metadataFile.text();
          const metadata = JSON.parse(metadataText);

          entries.push({
            id: entry.name,
            path: entry.name,
            metadata
          });
        } catch (error) {
          console.error('Failed to read metadata:', error);
        }
      }
    }

    return entries;
  }

  private async clearFileSystem(): Promise<void> {
    const entries = await this.listFromFileSystem();
    for (const entry of entries) {
      await this.deleteFromFileSystem(entry.id);
    }
  }

  // IndexedDB implementation
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LocalStorageAPI', 1);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('files')) {
          const store = db.createObjectStore('files', { keyPath: 'id' });
          store.createIndex('reviewId', 'metadata.reviewId', { unique: false });
          store.createIndex('type', 'metadata.type', { unique: false });
        }
      };
    });
  }

  private async saveToIndexedDB(
    file: Blob,
    path: string,
    id: string,
    metadata: StorageMetadata
  ): Promise<string> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');

      const entry = {
        id,
        path,
        blob: file,
        metadata
      };

      const request = store.put(entry);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(new Error('Failed to save to IndexedDB'));
    });
  }

  private async getFromIndexedDB(id: string): Promise<{ blob: Blob; metadata: StorageMetadata; url?: string } | null> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({ blob: result.blob, metadata: result.metadata });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(new Error('Failed to get from IndexedDB'));
    });
  }

  private async deleteFromIndexedDB(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete from IndexedDB'));
    });
  }

  private async listFromIndexedDB(): Promise<StorageEntry[]> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result.map((entry: any) => ({
          id: entry.id,
          path: entry.path,
          metadata: entry.metadata
        }));
        resolve(entries);
      };

      request.onerror = () => reject(new Error('Failed to list from IndexedDB'));
    });
  }

  private async clearIndexedDB(): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear IndexedDB'));
    });
  }

  // Tauri implementation
  private async initTauri(): Promise<void> {
    // @ts-ignore
    if (typeof window.__TAURI__ === 'undefined') {
      throw new Error('Tauri API not available');
    }
  }

  private async saveToTauri(
    file: Blob,
    path: string,
    id: string,
    metadata: StorageMetadata
  ): Promise<string> {
    try {
      // @ts-ignore
      const { invoke } = window.__TAURI__.tauri;
      
      // Convert blob to base64
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64 = btoa(String.fromCharCode(...uint8Array));

      await invoke('save_media_file', {
        id,
        data: base64,
        metadata: JSON.stringify(metadata)
      });

      return id;
    } catch (error) {
      throw new Error('Failed to save file via Tauri');
    }
  }

  private async getFromTauri(id: string): Promise<{ blob: Blob; metadata: StorageMetadata; url?: string } | null> {
    try {
      // @ts-ignore
      const { invoke } = window.__TAURI__.tauri;
      
      const result = await invoke('get_media_file', { id });
      
      if (!result) return null;

      // Convert base64 back to blob
      const binary = atob(result.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const metadata = JSON.parse(result.metadata);
      const blob = new Blob([bytes], { type: metadata.mimeType });

      return { blob, metadata };
    } catch (error) {
      return null;
    }
  }

  private async deleteFromTauri(id: string): Promise<void> {
    try {
      // @ts-ignore
      const { invoke } = window.__TAURI__.tauri;
      await invoke('delete_media_file', { id });
    } catch (error) {
      console.error('Failed to delete from Tauri:', error);
    }
  }

  private async listFromTauri(): Promise<StorageEntry[]> {
    try {
      // @ts-ignore
      const { invoke } = window.__TAURI__.tauri;
      const result = await invoke('list_media_files');
      return result;
    } catch (error) {
      return [];
    }
  }

  private async clearTauri(): Promise<void> {
    try {
      // @ts-ignore
      const { invoke } = window.__TAURI__.tauri;
      await invoke('clear_media_files');
    } catch (error) {
      console.error('Failed to clear Tauri storage:', error);
    }
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Helper function to create storage instance with auto-detection
export async function createStorage(config?: Partial<StorageConfig>): Promise<LocalStorageAPI> {
  let backend: StorageBackend = 'indexeddb'; // Default fallback

  // Auto-detect best available backend
  // @ts-ignore
  if (typeof window.__TAURI__ !== 'undefined') {
    backend = 'tauri';
  } else if ('showDirectoryPicker' in window) {
    backend = 'filesystem';
  }

  const storage = new LocalStorageAPI({
    backend: config?.backend || backend,
    maxSize: config?.maxSize || 500 * 1024 * 1024, // 500MB default
    customHandler: config?.customHandler
  });

  await storage.initialize();
  return storage;
}
