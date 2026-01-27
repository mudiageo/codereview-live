import { command, query } from '$app/server';
import * as v from 'valibot';
import { getUser } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { teamMembers, teams, teamInvitations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendTeamInviteEmail } from '$lib/server/email';
import { generateToken } from '$lib/server/utils/encryption';

export const inviteToTeam = command(
  v.object({
    teamId: v.string(),
    email: v.string([v.email()]),
    role: v.picklist(['admin', 'member', 'viewer']),
  }),
  async ({ teamId, email, role }) => {
    const user = await getUser();

    // Verify user owns the team
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team || team.ownerId !== user.id) {
      throw new Error('Team not found or unauthorized');
    }

    // Generate invitation token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(teamInvitations).values({
        teamId,
        email,
        role,
        invitedBy: user.id,
        token,
        expiresAt
    });

    await sendTeamInviteEmail(email, user.name || 'A user', team.name, token);

    return {
      success: true,
      message: 'Invitation sent',
    };
  }
);

export const joinTeam = command(
    v.object({
        token: v.string()
    }),
    async ({ token }) => {
        const user = await getUser();

        const invitation = await db.query.teamInvitations.findFirst({
            where: eq(teamInvitations.token, token)
        });

        if (!invitation || invitation.expiresAt < new Date()) {
            throw new Error('Invalid or expired invitation');
        }

        // Add to team members
        // Check if already a member
        const existingMember = await db.query.teamMembers.findFirst({
            where: and(eq(teamMembers.teamId, invitation.teamId), eq(teamMembers.userId, user.id))
        });

        if (!existingMember) {
             await db.insert(teamMembers).values({
                teamId: invitation.teamId,
                userId: user.id,
                role: invitation.role,
                invitedBy: invitation.invitedBy
            });
        }

        // Delete invitation
        await db.delete(teamInvitations).where(eq(teamInvitations.id, invitation.id));

        return { success: true, teamId: invitation.teamId };
    }
);

export const removeTeamMember = command(
  v.object({
    teamId: v.string(),
    memberId: v.string(),
  }),
  async ({ teamId, memberId }) => {
    const user = await getUser();

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team || team.ownerId !== user.id) {
      throw new Error('Team not found or unauthorized');
    }

    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, memberId)
        )
      );

    return { success: true };
  }
);

export const updateMemberRole = command(
  v.object({
    teamId: v.string(),
    memberId: v.string(),
    role: v.picklist(['admin', 'member', 'viewer']),
  }),
  async ({ teamId, memberId, role }) => {
    const user = await getUser();

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team || team.ownerId !== user.id) {
      throw new Error('Team not found or unauthorized');
    }

    await db
      .update(teamMembers)
      .set({ role })
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, memberId)
        )
      );

    return { success: true };
  }
);

export const getTeamMembers = query(
  v.object({ teamId: v.string() }),
  async ({ teamId }) => {
    const user = await getUser();

    const members = await db.query.teamMembers.findMany({
      where: eq(teamMembers.teamId, teamId),
      with: {
        user: true,
      },
    });

    return members;
  }
);
