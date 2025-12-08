import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { twoFactor, admin, multiSession } from 'better-auth/plugins';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { sendVerificationEmail, sendPasswordResetEmail } from './email';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		schema: {
			...schema,
			user: schema.users
		},
		provider: 'pg',
		usePlural: true
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendVerificationEmail: async ({ user, url, token }) => {
      await sendVerificationEmail(user.email, token);
    },
    sendResetPassword: async ({ user, url, token }) => {
			console.log(`Password reset link for ${user.email}: ${url}`);
      await sendPasswordResetEmail(user.email, token);
    },
		minPasswordLength: 8,
		maxPasswordLength: 128,
		autoSignIn: true,
	},
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID as string,
			clientSecret: env.GOOGLE_CLIENT_SECRET as string,
			enabled: !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET
		},
		github: { 
      clientId: process.env.GITHUB_CLIENT_ID as string, 
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 
    },
    gitlab: { 
      clientId: process.env.GITLAB_CLIENT_ID as string, 
      clientSecret: process.env.GITLAB_CLIENT_SECRET as string, 
    }, 
	},
	// Email verification configuration
	emailVerification: {
		sendVerificationEmail: async ({ user, url, token }) => {
			// TODO: Implement email sending for verification
			// When ready, send email with verification link: url
			console.log(`Email verification link for ${user.email}: ${url}`);
		},
		sendOnSignUp: true, 
		autoSignInAfterVerification: true
	},
	// Session configuration
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day - update session if older than this
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5 // 5 minutes
		}
	},
	// Account management
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ['google']
		}
	},
	// Security settings
	rateLimit: {
		enabled: true,
		window: 60, // 1 minute
		max: 10 // 10 requests per window
	},
	// Advanced configuration
	advanced: {
	  cookiePrefix: "cr_",
		generateId: () => crypto.randomUUID(),
		crossSubDomainCookies: {
			enabled: false
		}
	},
	// User configuration
  trustedOrigins: [process.env.PUBLIC_APP_URL!],
	user: {
		additionalFields: {
			plan: {
        type: "string",
        defaultValue: "free",
        required: false,
      },
      apiKey: {
        type: "string",
        required: false,
      },
		},
		changeEmail: {
			enabled: true,
			sendChangeEmailVerification: async ({ user, newEmail, url, token }) => {
				// TODO: Implement email sending for email change verification
				console.log(`Email change verification for ${user.email} to ${newEmail}: ${url}`);
			}
		}
	},
	// Plugins
	plugins: [
		// Two-factor authentication plugin
		twoFactor({
			issuer: env.BETTER_AUTH_URL || 'CodeReview Live',
			skipVerificationOnEnable: false,
			totpOptions: {
				period: 30,
				digits: 6
			}
		}),
		// Multi-session support
		multiSession(),
		// Admin plugin for user management
		admin(),
		sveltekitCookies(getRequestEvent),
		
	],
	experimental: { joins: true }
});


// Helper to get user from request
export async function getUser() {
  const event = getRequestEvent();
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  return session.user;
}

// Helper to check if user has permission
export async function checkPermission(
  requiredPlan: 'free' | 'pro' | 'team'
) {
  const user = await getUser();
  
  const planHierarchy = { free: 0, pro: 1, team: 2 };
  const userPlanLevel = planHierarchy[user.plan as keyof typeof planHierarchy] || 0;
  const requiredPlanLevel = planHierarchy[requiredPlan];
  
  if (userPlanLevel < requiredPlanLevel) {
    throw new Error('Insufficient permissions');
  }
  
  return user;
}