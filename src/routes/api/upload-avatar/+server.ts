import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUser } from '$lib/server/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Verify user is authenticated
    const user = await getUser();
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    const formData = await request.formData();
    const avatarEntry = formData.get('avatar');
    if (!(avatarEntry instanceof File)) {
      return json({ error: 'No file provided or invalid file' }, { status: 400 });
    }
    const avatar = avatarEntry;

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
    const extensionMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    const ext = extensionMap[avatar.type];
    if (!ext) {
      return json({ error: 'Unsupported image type' }, { status: 400 });
    }
    const filename = `${user.id}-${crypto.randomUUID()}.${ext}`;

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
