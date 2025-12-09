import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect } from '@sveltejs/kit'
import { rateLimit } from '$lib/server/rate-limit';

const protectedRoutes = [
  '/dashboard',
  '/projects',
  '/reviews',
  '/team',
  '/settings',
  '/onboarding',
];

const authRoutes = ['/login', '/signup'];

export const handle: Handle = async ({ event, resolve }) => {
  // Rate limiting
  const ip = building ? '' : event.getClientAddress();
  if (await rateLimit(ip)) {
    return new Response('Too many requests', { status: 429 });
  }

  // Get session from Better-Auth
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}
	
	// Populate event.locals.auth with a function that gets the session
	event.locals.auth = async () => {
		return await auth.api.getSession({
			headers: event.request.headers
		});
	};

  const { pathname } = event.url;

  // Redirect authenticated users away from auth pages
  if (session?.user && authRoutes.some((route) => pathname.startsWith(route))) {
    redirect(303, '/dashboard');
  }

  // Protect routes that require authentication
  if (
    !session?.user &&
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    if(!building) redirect(303, `/login?redirect=${pathname}`);
  }

  // Add security headers
  event.setHeaders({
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // 'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=()',
    ...(process.env.NODE_ENV === 'production' && {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    })  // CSP for production
});
 
  
  return svelteKitHandler({ event, resolve, auth, building });
};