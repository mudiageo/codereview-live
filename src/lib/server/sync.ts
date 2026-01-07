import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'
import { getUser } from '$lib/server/auth'
import { createServerSync } from 'sveltekit-sync/server';
import type { SyncConfig } from 'sveltekit-sync/server'
import { DrizzleAdapter } from 'sveltekit-sync/adapters/drizzle';

// Define your sync schema - what gets synced and who can access it
export const config: SyncConfig = {
  tables: {
    projects: {
      table: 'projects',
      columns: ['id', 'name', 'description', 'userId', 'repoUrl', 'color', 'isTeam', 'updatedAt', 'createdAt', '_version', '_updatedAt'],
    },
    reviews: {
      table: 'reviews',
      columns: ['id', 'projectId', 'authorId', 'title', 'description', 'codeContent', 'codeLanguage', 'videoUrl', 'videoSize', 'videoDuration', 'thumbnailUrl', 'shareToken', 'isPublic', 'status', 'aiSummary', 'metadata', 'viewCount', 'createdAt', 'updatedAt', '_version', '_updatedAt'],
    },
    comments: {
      table: 'comments',
      columns: ['id', 'reviewId', 'authorId', 'parentId', 'description', 'videoUrl', 'textContent' , 'videoTimestamp', 'codeLineStart', 'codeLineEnd', 'isResolved', 'createdAt', 'updatedAt', '_version', '_updatedAt'],
    },
    subscriptions: {
      table: 'subscriptions',
      columns: ['id', 'userId', 'plan', 'status', 'stripeSubscriptionId', 'paystackSubscriptionId', 'currentPeriodStart', 'currentPeriodEnd', 'cancelAtPeriodEnd', 'createdAt', 'updatedAt', '_version', '_updatedAt'],
    },
    teams: {
      table: 'teams',
      columns: ['id', 'name', 'ownerId', 'plan', 'maxMembers', 'createdAt', 'updatedAt', '_version', '_updatedAt'],
    },
    teamInvitations: {
      table: 'teamInvitations',
      columns: ['id', 'teamId', 'email', 'role', 'invitedBy', 'token', 'expiresAt', 'createdAt', '_version', '_updatedAt'],
    },
    aiUsage: {
      table: 'aiUsage',
      columns: ['id', 'userId', 'reviewId', 'feature', 'tokensUsed', 'success', 'createdAt'],
    },
  },
  batchSize: 100,
  realtime: {
    authenticate: async (request) => {
      const user = await getUser()
      return { userId: user.id, ...user};
    }
  }
};

const adapter = new DrizzleAdapter({ db, schema })

export const { syncEngine, handle } = createServerSync({ adapter, config });

