import { command, query } from '$app/server';
import * as v from 'valibot';
import { getUser } from '$lib/server/auth';
import {
  explainCode,
  generateReviewSuggestions,
  summarizeReview,
  detectCodeSmells,
  analyzeCode,
  checkReviewItems,
  estimateReviewTime,
  type CodeAnalysis,
} from '$lib/server/ai';
import { db } from '$lib/server/db';
import { aiUsage, users } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private'
import { planLimits } from '$lib/config/features'

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

  const used = result[0]?.totalUsed || 0;
  const limit = planLimits[user?.plan as keyof typeof planLimits].aiCreditsPerMonth || 50;

  return used < limit;
}

// Helper to get API key
async function getApiKey(userId: string): Promise<string> {
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const apiKey = userRecord?.apiKey || env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Add your key in Settings > AI.');
  }
  return apiKey;
}

// Helper for common auth/credit check
async function prepareAICall(): Promise<{ userId: string; apiKey: string }> {
  const user = await getUser();

  const hasCredits = await checkAICredits(user.id);
  if (!hasCredits) {
    throw new Error('AI credit limit reached. Please upgrade your plan.');
  }

  const apiKey = await getApiKey(user.id);
  return { userId: user.id, apiKey };
}

/**
 * Explain code in plain English
 */
export const explainCodeAI = command(
  v.object({
    code: v.string(),
    language: v.string(),
    reviewId: v.optional(v.string()),
  }),
  async ({ code, language, reviewId }) => {
    const { userId, apiKey } = await prepareAICall();

    return await explainCode({
      code,
      language,
      apiKey,
      userId,
      reviewId,
    });
  }
);

/**
 * Generate improvement suggestions
 */
export const generateSuggestionsAI = command(
  v.object({
    code: v.string(),
    language: v.string(),
    reviewId: v.optional(v.string()),
  }),
  async ({ code, language, reviewId }) => {
    const { userId, apiKey } = await prepareAICall();

    return await generateReviewSuggestions({
      code,
      language,
      apiKey,
      userId,
      reviewId,
    });
  }
);

/**
 * Generate review summary
 */
export const summarizeReviewAI = command(
  v.object({
    code: v.string(),
    description: v.optional(v.string()),
    language: v.string(),
    reviewId: v.optional(v.string()),
  }),
  async ({ code, description, language, reviewId }) => {
    const { userId, apiKey } = await prepareAICall();

    return await summarizeReview({
      code,
      description,
      language,
      apiKey,
      userId,
      reviewId,
    });
  }
);

/**
 * Detect code smells
 */
export const detectCodeSmellsAI = command(
  v.object({
    code: v.string(),
    language: v.string(),
    reviewId: v.optional(v.string()),
  }),
  async ({ code, language, reviewId }) => {
    const { userId, apiKey } = await prepareAICall();

    return await detectCodeSmells({
      code,
      language,
      apiKey,
      userId,
      reviewId,
    });
  }
);

/**
 * Full code analysis - bugs, security, performance, suggestions
 */
export const analyzeCodeAI = command(
  v.object({
    code: v.string(),
    language: v.string(),
    reviewId: v.optional(v.string()),
  }),
  async ({ code, language, reviewId }): Promise<CodeAnalysis> => {
    const { userId, apiKey } = await prepareAICall();

    return await analyzeCode({
      code,
      language,
      apiKey,
      userId,
      reviewId,
    });
  }
);

/**
 * Auto-check review checklist items
 */
export const checkReviewItemsAI = command(
  v.object({
    code: v.string(),
    language: v.string(),
    reviewId: v.optional(v.string()),
    checklistItems: v.array(v.object({
      id: v.string(),
      text: v.string(),
      category: v.string(),
    })),
  }),
  async ({ code, language, reviewId, checklistItems }) => {
    const { userId, apiKey } = await prepareAICall();

    return await checkReviewItems(
      { code, language, apiKey, userId, reviewId },
      checklistItems
    );
  }
);

/**
 * Estimate review time
 */
export const estimateReviewTimeAI = command(
  v.object({
    code: v.string(),
    language: v.string(),
    reviewId: v.optional(v.string()),
  }),
  async ({ code, language, reviewId }) => {
    const { userId, apiKey } = await prepareAICall();

    return await estimateReviewTime({
      code,
      language,
      apiKey,
      userId,
      reviewId,
    });
  }
);

/**
 * Get AI usage stats for current user
 */
export const getAIUsage = query(
  async () => {
    const user = await getUser();

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


    return {
      used: result[0]?.totalTokens || 0,
      limit: planLimits[userRecord?.plan as keyof typeof planLimits].aiCreditsPerMonth || 50,
      calls: result[0]?.totalCalls || 0,
    };
  }
);