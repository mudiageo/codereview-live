import { command, query } from '$app/server';
import * as v from 'valibot';
import { getUser, checkPermission } from '$lib/server/auth';
import {
  explainCode,
  generateReviewSuggestions,
  summarizeReview,
  detectCodeSmells,
} from './ai';
import { db } from '$lib/server/db';
import { aiUsage, users } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

// Check AI credits and user limits
async function checkAICredits(userId: string): Promise<boolean> {
  const result = await db
    .select({
      totalUsed: sql<number>`sum(${aiUsage.tokensUsed})`,
    })
    .from(aiUsage)
    .where(eq(aiUsage.userId, userId))
    .groupBy(aiUsage.userId);

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const limits = {
    free: 50,
    pro: 1000,
    team: 5000,
  };

  const used = result[0]?.totalUsed || 0;
  const limit = limits[user?.plan as keyof typeof limits] || 50;

  return used < limit;
}

export const explainCodeAI = command(
  v.object({
    code: v.string(),
    language: v.string(),
    reviewId: v.optional(v.string()),
  }),
  async ({ code, language, reviewId }, { request }) => {
    const user = await getUser(request);

    // Check AI credits
    const hasCredits = await checkAICredits(user.id);
    if (!hasCredits) {
      throw new Error('AI credit limit reached. Please upgrade your plan.');
    }

    // Get user's API key or use default
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    const apiKey = userRecord?.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    return await explainCode({
      code,
      language,
      apiKey,
      userId: user.id,
      reviewId,
    });
  }
);

export const generateSuggestionsAI = command(
  v.object({
    code: v.string(),
    language: v.string(),
    reviewId: v.optional(v.string()),
  }),
  async ({ code, language, reviewId }, { request }) => {
    const user = await getUser(request);

    const hasCredits = await checkAICredits(user.id);
    if (!hasCredits) {
      throw new Error('AI credit limit reached. Please upgrade your plan.');
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    const apiKey = userRecord?.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    return await generateReviewSuggestions({
      code,
      language,
      apiKey,
      userId: user.id,
      reviewId,
    });
  }
);

export const summarizeReviewAI = command(
  v.object({
    code: v.string(),
    description: v.optional(v.string()),
    language: v.string(),
    reviewId: v.optional(v.string()),
  }),
  async ({ code, description, language, reviewId }, { request }) => {
    const user = await getUser(request);

    const hasCredits = await checkAICredits(user.id);
    if (!hasCredits) {
      throw new Error('AI credit limit reached. Please upgrade your plan.');
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    const apiKey = userRecord?.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    return await summarizeReview({
      code,
      description,
      language,
      apiKey,
      userId: user.id,
      reviewId,
    });
  }
);

export const detectCodeSmellsAI = command(
  v.object({
    code: v.string(),
    language: v.string(),
    reviewId: v.optional(v.string()),
  }),
  async ({ code, language, reviewId }, { request }) => {
    const user = await getUser(request);

    const hasCredits = await checkAICredits(user.id);
    if (!hasCredits) {
      throw new Error('AI credit limit reached. Please upgrade your plan.');
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    const apiKey = userRecord?.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    return await detectCodeSmells({
      code,
      language,
      apiKey,
      userId: user.id,
      reviewId,
    });
  }
);

export const getAIUsage = query(
  v.object({}),
  async (_, { request }) => {
    const user = await getUser(request);

    const result = await db
      .select({
        totalTokens: sql<number>`sum(${aiUsage.tokensUsed})`,
        totalCalls: sql<number>`count(*)`,
      })
      .from(aiUsage)
      .where(eq(aiUsage.userId, user.id));

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    const limits = {
      free: 50,
      pro: 1000,
      team: 5000,
    };

    return {
      used: result[0]?.totalTokens || 0,
      limit: limits[userRecord?.plan as keyof typeof limits] || 50,
      calls: result[0]?.totalCalls || 0,
    };
  }
);