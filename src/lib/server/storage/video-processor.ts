import ffmpeg from 'fluent-ffmpeg';
import { createWriteStream, createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { config } from '../config';

export async function compressVideo(
  inputPath: string,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<string> {
  const outputPath = join(tmpdir(), `compressed-${Date.now()}.mp4`);

  const crf = {
    low: 35,
    medium: 28,
    high: 23,
  };

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',
        `-crf ${crf[quality]}`,
        '-preset medium',
        '-c:a aac',
        '-b:a 128k',
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

export async function generateThumbnail(
  videoPath: string,
  timestamp: string = '00:00:01'
): Promise<string> {
  const thumbnailPath = join(tmpdir(), `thumb-${Date.now()}.jpg`);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestamp],
        filename: thumbnailPath,
        size: '640x360',
      })
      .on('end', () => resolve(thumbnailPath))
      .on('error', reject);
  });
}

export async function getVideoMetadata(videoPath: string): Promise<{
  duration: number;
  width: number;
  height: number;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) reject(err);

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');

      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
        size: metadata.format.size || 0,
      });
    });
  });
}