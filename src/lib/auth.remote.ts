import { auth } from '$lib/server/auth';
import { command, getRequestEvent } from 'app/server';
import { redirect } from '@sveltejs/kit';



export const verifyEmail = command(async () => {
  
  const { url } = getRequestEvent()
  const token = url.searchParams.get('token');
  
  if (!token) {
    redirect(303, '/login');
  }

  try {
    await auth.api.verifyEmail({
      body: { token },
    });

    return {
      success: true,
      message: 'Email verified successfully!',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Invalid or expired verification link.',
    };
  }
})
