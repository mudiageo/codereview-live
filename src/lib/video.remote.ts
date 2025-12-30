import { form, command } from '$app/server';
import * as v from 'valibot';
import { getUser } from '$lib/server/auth';
import { uploadFile, deleteFile } from '$lib/server/storage';
import { compressVideo, generateThumbnail, getVideoMetadata } from '$lib/server/storage/video-processor';
import { config } from '$lib/server/config';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';

const MAX_SIZE = config.video.maxSizeMB * 1024 * 1024;

export const uploadVideo = command(
  v.object({
    video: v.custom<File>((val) => val instanceof File, 'Video file is required'),
    reviewId: v.string(),
  }),
  async ({ video, reviewId }) => {
    const user = await getUser();

    // Validate file size
    if (video.size > MAX_SIZE) {
      throw new Error(`Video size exceeds ${config.video.maxSizeMB}MB limit`);
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(video.type)) {
      throw new Error('Invalid video format. Supported: MP4, WebM, MOV');
    }

    try {
      // Save to temp file for processing
      const tempPath = join(tmpdir(), `upload-${Date.now()}-${video.name}`);
      const buffer = Buffer.from(await video.arrayBuffer());
      await writeFile(tempPath, buffer);

      let processedPath = tempPath;
      let thumbnail: string | null = null;

      // Compress video if enabled
      if (config.video.enableServerCompression) {
        const compressedPath = await compressVideo(tempPath, 'medium');
        await unlink(tempPath);
        processedPath = compressedPath;
      }

      // Generate thumbnail
      if (config.video.thumbnailEnabled) {
        thumbnail = await generateThumbnail(processedPath);
      }

      // Get video metadata
      const metadata = await getVideoMetadata(processedPath);

      // Upload processed video
      const videoResult = await uploadFile({
        file: new Blob([await fs.readFile(processedPath)]),
        filename: `${reviewId}-${Date.now()}.mp4`,
        contentType: 'video/mp4',
        folder: 'videos',
      });

      // Upload thumbnail if generated
      let thumbnailUrl: string | undefined;
      if (thumbnail) {
        const thumbnailResult = await uploadFile({
          file: new Blob([await fs.readFile(thumbnail)]),
          filename: `${reviewId}-thumb-${Date.now()}.jpg`,
          contentType: 'image/jpeg',
          folder: 'thumbnails',
        });
        thumbnailUrl = thumbnailResult.url;
        await unlink(thumbnail);
      }

      // Cleanup temp files
      await unlink(processedPath);

      return {
        success: true,
        videoUrl: videoResult.url,
        thumbnailUrl,
        metadata: {
          duration: Math.round(metadata.duration),
          size: videoResult.size,
          width: metadata.width,
          height: metadata.height,
        },
      };
    } catch (error) {
      console.error('Video upload failed:', error);
      throw new Error('Failed to upload video');
    }
  }
);

export const deleteVideo = command(
  v.object({
    videoKey: v.string(),
    thumbnailKey: v.optional(v.string()),
  }),
  async ({ videoKey, thumbnailKey }) => {
    const user = await getUser();

    try {
      await deleteFile(videoKey);
      if (thumbnailKey) {
        await deleteFile(thumbnailKey);
      }

      return { success: true };
    } catch (error) {
      console.error('Video deletion failed:', error);
      throw new Error('Failed to delete video');
    }
  }
);
