/**
 * Format bytes to human-readable storage size
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "1.5 GB"
 */
export function formatStorageSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  if (bytes === -1) return 'Unlimited';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Parse storage string (like "50GB", "1GB") to bytes
 * @param storageString - String like "50GB", "1 GB", "1024MB"
 * @returns Number of bytes
 */
export function parseStorageString(storageString: string): number {
  if (!storageString) return 0;
  if (storageString.toLowerCase() === 'unlimited') return -1;

  const match = storageString.match(/^(\d+(?:\.\d+)?)\s*(TB|GB|MB|KB|Bytes?)$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers: { [key: string]: number } = {
    BYTES: 1,
    BYTE: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };

  return value * (multipliers[unit] || 0);
}

/**
 * Calculate storage percentage
 * @param used - Used storage in bytes
 * @param limit - Storage limit in bytes (or -1 for unlimited)
 * @returns Percentage (0-100) or -1 for unlimited
 */
export function calculateStoragePercentage(used: number, limit: number): number {
  if (limit === -1) return -1; // Unlimited
  if (limit === 0) return 100;
  return Math.min((used / limit) * 100, 100);
}
