import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUser } from '$lib/server/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Verify user is authenticated
    const user = await getUser();
    
    const formData = await request.formData();
    const avatar = formData.get('avatar') as File;
    
    if (!avatar) {
      return json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    if (!avatar.type.startsWith('image/')) {
      return json({ error: 'File must be an image' }, { status: 400 });
    }
    
    // Validate file size (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (avatar.size > MAX_SIZE) {
      return json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }
    
    // Generate unique filename
    const ext = avatar.name.split('.').pop();
    const filename = `${user.id}-${nanoid()}.${ext}`;
    
    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'static', 'uploads', 'avatars');
    await mkdir(uploadDir, { recursive: true });
    
    // Save file
    const filepath = join(uploadDir, filename);
    const buffer = Buffer.from(await avatar.arrayBuffer());
    await writeFile(filepath, buffer);
    
    // Return public URL
    const url = `/uploads/avatars/${filename}`;
    
    return json({ url });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
};
