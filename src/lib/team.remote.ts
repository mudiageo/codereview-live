import { command, query } from '$app/server';
import * as v from 'valibot';
import { getUser } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { teamMembers, projects } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendTeamInviteEmail } from '$lib/server/email';
import { generateToken } from '$lib/server/utils/encryption';

export const inviteTeamMember = command(
  v.object({
    projectId: v.string(),
    email: v.string([v.email()]),
    role: v.picklist(['admin', 'member', 'viewer']),
  }),
  async ({ projectId, email, role }) => {
    const user = await getUser();

    // Verify user owns the project
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project || project.userId !== user.id) {
      throw new Error('Project not found or unauthorized');
    }

    // Generate invitation token
    const token = generateToken();

    // Store invitation (you'll need an invitations table)
    // For now, we'll send email directly

    await sendTeamInviteEmail(email, user.name || 'A user', project.name, token);

    return {
      success: true,
      message: 'Invitation sent',
    };
  }
);

export const removeTeamMember = command(
  v.object({
    projectId: v.string(),
    memberId: v.string(),
  }),
  async ({ projectId, memberId }) => {
    const user = await getUser();

    // Verify user owns the project or is admin
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project || project.userId !== user.id) {
      throw new Error('Project not found or unauthorized');
    }

    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.projectId, projectId),
          eq(teamMembers.userId, memberId)
        )
      );

    return { success: true };
  }
);

export const updateMemberRole = command(
  v.object({
    projectId: v.string(),
    memberId: v.string(),
    role: v.picklist(['admin', 'member', 'viewer']),
  }),
  async ({ projectId, memberId, role }) => {
    const user = await getUser();

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project || project.userId !== user.id) {
      throw new Error('Project not found or unauthorized');
    }

    await db
      .update(teamMembers)
      .set({ role })
      .where(
        and(
          eq(teamMembers.projectId, projectId),
          eq(teamMembers.userId, memberId)
        )
      );

    return { success: true };
  }
);

export const getTeamMembers = query(
  v.object({ projectId: v.string() }),
  async ({ projectId }) => {
    const user = await getUser();

    const members = await db.query.teamMembers.findMany({
      where: eq(teamMembers.projectId, projectId),
      with: {
        user: true,
      },
    });

    return members;
  }
);