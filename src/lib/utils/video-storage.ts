// Client-side video storage handling
// Supports OPFS and IndexedDB

export type StorageType = 'opfs' | 'indexeddb';

export interface VideoStorageItem {
  id: string;
  blob: Blob;
  mimeType: string;
  timestamp: number;
}

class ClientVideoStorage {
  private dbName = 'code-review-videos';
  private storeName = 'videos';
  private db: IDBDatabase | null = null;

  async init() {
    if (this.db) return;

    return new Promise<void>((resolve, reject) => {
      const request = indexeddb.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async saveVideo(id: string, blob: Blob): Promise<string> {
    // Try OPFS first (better performance for large files)
    if (await this.isOPFSSupported()) {
      try {
        await this.saveToOPFS(id, blob);
        return `opfs:${id}`;
      } catch (e) {
        console.warn('OPFS save failed, falling back to IndexedDB', e);
      }
    }

    // Fallback to IndexedDB
    await this.saveToIndexedDB(id, blob);
    return `indexeddb:${id}`;
  }

  async getVideo(url: string): Promise<Blob | null> {
    const [protocol, id] = url.split(':');

    if (protocol === 'opfs') {
      try {
        return await this.getFromOPFS(id);
      } catch (e) {
        console.error('Failed to load from OPFS', e);
        return null;
      }
    } else if (protocol === 'indexeddb') {
      return await this.getFromIndexedDB(id);
    }

    return null;
  }

  // OPFS Implementation
  private async isOPFSSupported() {
    return typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage;
  }

  private async saveToOPFS(id: string, blob: Blob) {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(id, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  private async getFromOPFS(id: string): Promise<Blob> {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(id);
    return await fileHandle.getFile();
  }

  // IndexedDB Implementation
  private async saveToIndexedDB(id: string, blob: Blob) {
    await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ id, blob, mimeType: blob.type, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromIndexedDB(id: string): Promise<Blob | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as VideoStorageItem;
        resolve(result ? result.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const clientVideoStorage = new ClientVideoStorage();
const indexeddb = typeof window !== 'undefined' ? window.indexedDB : { open: () => {} } as any;
