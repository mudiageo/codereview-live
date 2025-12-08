import fs from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';

// Initialize S3 client (works for both AWS S3 and Cloudflare R2)
const getS3Client = () => {
  if (config.storage.provider === 'r2') {
    return new S3Client({
      region: 'auto',
      endpoint: `https://${config.storage.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.storage.r2.accessKeyId,
        secretAccessKey: config.storage.r2.secretAccessKey,
      },
    });
  } else if (config.storage.provider === 's3') {
    return new S3Client({
      region: config.storage.s3.region,
      credentials: {
        accessKeyId: config.storage.s3.accessKeyId,
        secretAccessKey: config.storage.s3.secretAccessKey,
      },
    });
  }
  return null;
};

export interface UploadOptions {
  file: File | Blob;
  filename: string;
  contentType: string;
  folder?: string;
}

export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { file, filename, contentType, folder = 'videos' } = options;
  const key = `${folder}/${Date.now()}-${filename}`;

  if (config.storage.provider === 'local') {
    return await uploadToLocal(file, key, contentType);
  } else if (config.storage.provider === 'r2') {
    return await uploadToR2(file, key, contentType);
  } else if (config.storage.provider === 's3') {
    return await uploadToS3(file, key, contentType);
  } else {
    throw new Error(`Unsupported storage provider: ${config.storage.provider}`);
  }
}

async function uploadToLocal(
  file: File | Blob,
  key: string,
  contentType: string
): Promise<UploadResult> {
  const uploadPath = path.join(process.cwd(), config.storage.local.path, key);
  const directory = path.dirname(uploadPath);

  // Ensure directory exists
  await fs.mkdir(directory, { recursive: true });

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(uploadPath, buffer);

  return {
    url: `${config.storage.local.publicUrl}/${key}`,
    key,
    size: buffer.length,
  };
}

async function uploadToR2(
  file: File | Blob,
  key: string,
  contentType: string
): Promise<UploadResult> {
  const client = getS3Client()!;
  const buffer = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: config.storage.r2.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return {
    url: `${config.storage.r2.publicUrl}/${key}`,
    key,
    size: buffer.length,
  };
}

async function uploadToS3(
  file: File | Blob,
  key: string,
  contentType: string
): Promise<UploadResult> {
  const client = getS3Client()!;
  const buffer = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: config.storage.s3.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return {
    url: `${config.storage.s3.publicUrl}/${key}`,
    key,
    size: buffer.length,
  };
}

export async function deleteFile(key: string): Promise<void> {
  if (config.storage.provider === 'local') {
    const filePath = path.join(process.cwd(), config.storage.local.path, key);
    await fs.unlink(filePath);
  } else {
    const client = getS3Client()!;
    const bucketName =
      config.storage.provider === 'r2'
        ? config.storage.r2.bucketName
        : config.storage.s3.bucketName;

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
  }
}

export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  if (config.storage.provider === 'local') {
    return `${config.storage.local.publicUrl}/${key}`;
  }

  const client = getS3Client()!;
  const bucketName =
    config.storage.provider === 'r2'
      ? config.storage.r2.bucketName
      : config.storage.s3.bucketName;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn });
}
