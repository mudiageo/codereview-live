import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'
import { ServerSyncEngine } from 'sveltekit-sync/server';
import { DrizzleAdapter } from 'sveltekit-sync/adapters/drizzle';


const adapter = new DrizzleAdapter({ db, schema })

export const syncEngine = new ServerSyncEngine(adapter, {
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
      table: 'team_invitations',
      columns: ['id', 'teamId', 'email', 'role', 'invitedBy', 'token', 'expiresAt', 'createdAt', '_version', '_updatedAt'],
    },
    aiUsage: {
      table: 'ai_usage',
      columns: ['id', 'userId', 'reviewId', 'feature', 'tokensUsed', 'success', 'createdAt'],
    },
  },
  batchSize: 100,
  enableRealtime: true
});
