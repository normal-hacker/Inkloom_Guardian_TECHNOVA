import crypto from 'node:crypto';

/**
 * Computes deterministic SHA-256 hash of text in hex format
 */
export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}
