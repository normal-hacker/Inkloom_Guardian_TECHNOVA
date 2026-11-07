import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env.test') });
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://guardian:guardian@localhost:5432/guardian',
      SESSION_SECRET: process.env.SESSION_SECRET || 'your-random-secret',
      DEMO_MODE: process.env.DEMO_MODE || 'true',
      AUTH_BASE_URL: process.env.AUTH_BASE_URL || 'http://localhost:3000',
      AI_PROVIDER: process.env.AI_PROVIDER || 'mock',
      AI_TIMEOUT_S: process.env.AI_TIMEOUT_S || '20',
      MAX_UPLOAD_MB: process.env.MAX_UPLOAD_MB || '10',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
    },
  },
  resolve: {
    alias: {
      '@/components': path.resolve(__dirname, './components'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
