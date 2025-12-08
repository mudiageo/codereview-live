import { IndexedDBAdapter } from 'sveltekit-sync/adapters';
import { SyncEngine } from 'sveltekit-sync';
import { pushChanges, pullChanges } from '$lib/sync.remote';
import { browser } from '$app/environment';

export const adapter = new IndexedDBAdapter('codereview-db', 1);


export const syncEngine = new SyncEngine({
  local: {
    db: null,
    adapter
  },
  remote: {
    push: data => pushChanges(data),
    pull: (lastSync: number, clientId: string) => pullChanges({ lastSync, clientId })
  },
  syncInterval: 30000,
  conflictResolution: 'last-write-wins',
  onSync: (status) => {
    console.log('Sync status:', status);
  }
});

// Initialize with optimized first load
export async function initDb() {
  // Only run in browser
  if (!browser) {
    console.warn('initDB called on server - skipping');
    return;
  }

  try {
    await adapter.init({
      reviews: 'id',
      projects: 'id',
      comments: 'id',
      users: 'id',
      teamMembers: 'id',
      subscriptions: 'id',
      teams: 'id',
      teamInvitations: 'id',
      aiUsage: 'id',
    });

    // SyncEngine.init() now handles initial data pull automatically
    await syncEngine.init();

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}