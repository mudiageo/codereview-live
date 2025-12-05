import { query, command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { syncEngine } from '$lib/server/sync'
// import { getUser } from '$lib/server/auth'; // Your auth function
function getUser(req) {
  return { id: 'uswr1' }
}

// Validation schemas
const SyncOperationSchema = v.object({
  id: v.string(),
  table: v.string(),
  operation: v.picklist(['insert', 'update', 'delete']),
  data: v.any(),
  timestamp: v.date(),
  clientId: v.string(),
  version: v.number(),
  status: v.picklist(['pending', 'synced', 'error'])
});

const SyncOperationsArraySchema = v.array(SyncOperationSchema);


// PUSH CHANGES TO SERVER
export const pushChanges = command(
  SyncOperationsArraySchema,
  async (operations) => {
    const { request } = getRequestEvent()
    // Get authenticated user
    const user = await getUser(request);
    if (!user) {
      throw new Error('Unauthorized');
    }
    // Process the sync operations
    const result = await syncEngine.push(operations, user.id);
    await pullChanges({ lastSync: 0, clientId: operations[0].clientId }).refresh()
    return result;
  }
);

// PULL CHANGES FROM SERVER
export const pullChanges = query(
  v.object({
    lastSync: v.number(),
    clientId: v.string()
  }),
  async ({ lastSync, clientId }) => {
    const { request } = getRequestEvent()
    const user = await getUser(request);
    if (!user) {
      throw new Error('Unauthorized');
    }

    const operations = await syncEngine.pull(lastSync, clientId, user.id);
    return operations;
  }
);
