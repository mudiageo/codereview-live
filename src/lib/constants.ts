/**
 * Application-wide configuration constants
 * Shared constants used across multiple components
 */

// File upload constraints
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// CSS custom property names
export const CSS_VARS = {
  EDITOR_FONT_SIZE: '--editor-font-size',
} as const;

// Editor settings
export const EDITOR = {
  MIN_FONT_SIZE: 10,
  MAX_FONT_SIZE: 20,
  DEFAULT_FONT_SIZE: 14,
} as const;

// Video settings
export const VIDEO = {
  MIN_SIZE_MB: 50,
  MAX_SIZE_MB: 500,
  DEFAULT_SIZE_MB: 100,
} as const;

// File size conversion
export const FILE_SIZE = {
  BYTES_PER_MB: 1024 * 1024,
  BYTES_PER_GB: 1024 * 1024 * 1024,
} as const;

// API endpoints (for future use)
export const API = {
  GOOGLE_AI_STUDIO: 'https://aistudio.google.com/app/apikey',
} as const;
