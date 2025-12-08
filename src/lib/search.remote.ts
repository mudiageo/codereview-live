import { query } from '$app/server';
import * as v from 'valibot';
import { getUser } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { reviews, projects } from '$lib/server/db/schema';
import { or, like, eq, and } from 'drizzle-orm';

export const searchAll = query(
  v.object({
    query: v.string(),
  }),
  async ({ query }) => {
    const user = await getUser();

    const searchTerm = `%${query}%`;

    // Search reviews
    const reviewResults = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.authorId, user.id),
          or(
            like(reviews.title, searchTerm),
            like(reviews.description, searchTerm)
          )
        )
      )
      .limit(10);

    // Search projects
    const projectResults = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.userId, user.id),
          or(
            like(projects.name, searchTerm),
            like(projects.description, searchTerm)
          )
        )
      )
      .limit(10);

    return {
      reviews: reviewResults,
      projects: projectResults,
    };
  }
);