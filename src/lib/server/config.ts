import {
  PUBLIC_APP_NAME,
  PUBLIC_APP_URL,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  EMAIL_PROVIDER,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_FROM,
  RESEND_API_KEY,
  STORAGE_PROVIDER,
  LOCAL_STORAGE_PATH,
  PUBLIC_STORAGE_URL,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  S3_REGION,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME,
  S3_PUBLIC_URL,
  MAX_VIDEO_SIZE_MB,
  ENABLE_SERVER_COMPRESSION,
  VIDEO_THUMBNAIL_ENABLED,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_PRO_PRICE_ID,
  STRIPE_TEAM_PRICE_ID,
  PAYSTACK_SECRET_KEY,
  PAYSTACK_PRO_PLAN_CODE,
  PAYSTACK_TEAM_PLAN_CODE,
  RATE_LIMIT_ENABLED,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS
} from '$app/env/private';

export const config = {
  app: {
    name: PUBLIC_APP_NAME || 'CodeReview.live',
    url: PUBLIC_APP_URL || 'http://localhost:5173'
  },
  auth: { secret: BETTER_AUTH_SECRET!, url: BETTER_AUTH_URL! },
  email: {
    provider: (EMAIL_PROVIDER || 'nodemailer') as 'nodemailer' | 'resend',
    smtp: {
      host: SMTP_HOST!,
      port: parseInt(SMTP_PORT || '587'),
      user: SMTP_USER!,
      password: SMTP_PASSWORD!,
      from: SMTP_FROM!
    },
    resend: { apiKey: RESEND_API_KEY! }
  },
  storage: {
    provider: (STORAGE_PROVIDER || 'local') as 'local' | 'r2' | 's3' | 'hybrid',
    local: {
      path: LOCAL_STORAGE_PATH || './uploads',
      publicUrl: PUBLIC_STORAGE_URL!
    },
    r2: {
      accountId: R2_ACCOUNT_ID!,
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
      bucketName: R2_BUCKET_NAME!,
      publicUrl: R2_PUBLIC_URL!
    },
    s3: {
      region: S3_REGION || 'us-east-1',
      accessKeyId: S3_ACCESS_KEY_ID!,
      secretAccessKey: S3_SECRET_ACCESS_KEY!,
      bucketName: S3_BUCKET_NAME!,
      publicUrl: S3_PUBLIC_URL!
    }
  },
  video: {
    maxSizeMB: parseInt(MAX_VIDEO_SIZE_MB || '500'),
    enableServerCompression: ENABLE_SERVER_COMPRESSION === 'true',
    thumbnailEnabled: VIDEO_THUMBNAIL_ENABLED === 'true'
  },

  payments: {
    stripe: {
      secretKey: STRIPE_SECRET_KEY!,
      webhookSecret: STRIPE_WEBHOOK_SECRET!,
      proPriceId: STRIPE_PRO_PRICE_ID!,
      teamPriceId: STRIPE_TEAM_PRICE_ID!
    },
    paystack: {
      secretKey: PAYSTACK_SECRET_KEY!,
      proPlanCode: PAYSTACK_PRO_PLAN_CODE!,
      teamPlanCode: PAYSTACK_TEAM_PLAN_CODE!
    }
  },
  rateLimit: {
    enabled: RATE_LIMIT_ENABLED === 'true',
    maxRequests: parseInt(RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs: parseInt(RATE_LIMIT_WINDOW_MS || '60000')
  }
};
