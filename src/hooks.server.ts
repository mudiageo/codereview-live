import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect } from '@sveltejs/kit'

const protectedRoutes = {
	'/app/student': {
		allowedRoles: ['student'],
	},
	'/app/company': {
		allowedRoles: ['company'],
	},
}

export async function handle({ event, resolve }) {
	
	// Fetch current session from Better Auth
	const session = await auth.api.getSession({
		headers: event.request.headers,
	});
	
	// Make session and user available on server
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
			
	const currentPath = event.url.pathname;
		// Check protected routes
	const protectedRoute = Object.entries(protectedRoutes).find(
				([route]) => route === currentPath || currentPath.startsWith(route)
			);

	if (protectedRoute) {
		const routeConfig = protectedRoute[1];

		if (!session?.user) redirect(303, '/auth/login');
		if (routeConfig.allowedRoles && !routeConfig.allowedRoles.includes(session.user.userType)) {
		  
				redirect(303,  session.user.userType ? `/app/${session.user.userType}` : '/auth/login');
			}
	}


	return svelteKitHandler({ event, resolve, auth, building });
}