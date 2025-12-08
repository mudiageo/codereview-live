import { env } from '$env/dynamic/private';

export const config = {
  app: {
    name: env.PUBLIC_APP_NAME || 'CodeReview.live',
    url: env.PUBLIC_APP_URL || 'http://localhost:5173',
  },

  auth: {
    secret: env.BETTER_AUTH_SECRET!,
    url: env.BETTER_AUTH_URL!,
  },

  email: {
    provider: (env.EMAIL_PROVIDER || 'nodemailer') as 'nodemailer' | 'resend',
    smtp: {
      host: env.SMTP_HOST!,
      port: parseInt(env.SMTP_PORT || '587'),
      user: env.SMTP_USER!,
      password: env.SMTP_PASSWORD!,
      from: env.SMTP_FROM!,
    },
    resend: {
      apiKey: env.RESEND_API_KEY!,
    },
  },

  storage: {
    provider: (env.STORAGE_PROVIDER || 'local') as 'local' | 'r2' | 's3' | 'hybrid',
    local: {
      path: env.LOCAL_STORAGE_PATH || './uploads',
      publicUrl: env.PUBLIC_STORAGE_URL!,
    },
    r2: {
      accountId: env.R2_ACCOUNT_ID!,
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      bucketName: env.R2_BUCKET_NAME!,
      publicUrl: env.R2_PUBLIC_URL!,
    },
    s3: {
      region: env.S3_REGION || 'us-east-1',
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
      bucketName: env.S3_BUCKET_NAME!,
      publicUrl: env.S3_PUBLIC_URL!,
    },
  },

  video: {
    maxSizeMB: parseInt(env.MAX_VIDEO_SIZE_MB || '500'),
    enableServerCompression: env.ENABLE_SERVER_COMPRESSION === 'true',
    thumbnailEnabled: env.VIDEO_THUMBNAIL_ENABLED === 'true',
  },

  payments: {
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY!,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET!,
      proPriceId: env.STRIPE_PRO_PRICE_ID!,
      teamPriceId: env.STRIPE_TEAM_PRICE_ID!,
    },
    paystack: {
      secretKey: env.PAYSTACK_SECRET_KEY!,
      proPlanCode: env.PAYSTACK_PRO_PLAN_CODE!,
      teamPlanCode: env.PAYSTACK_TEAM_PLAN_CODE!,
    },
  },

  rateLimit: {
    enabled: env.RATE_LIMIT_ENABLED === 'true',
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS || '60000'),
  },
};