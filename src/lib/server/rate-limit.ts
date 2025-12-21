import { config } from './config';
import type { RequestEvent } from '@sveltejs/kit';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export async function rateLimit(ip): Promise<boolean> {
  if (!config.rateLimit.enabled) return false;


  const now = Date.now();

  if (!store[ip] || now > store[ip].resetTime) {
    store[ip] = {
      count: 1,
      resetTime: now + config.rateLimit.windowMs,
    };
    return false;
  }

  store[ip].count++;

  if (store[ip].count > config.rateLimit.maxRequests) {
    return true;
  }

  return false;
}

// Cleanup old entries periodically
if (config.rateLimit.enabled) {
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }, config.rateLimit.windowMs);
}
