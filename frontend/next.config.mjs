import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load root .env files, then local frontend .env files
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  devIndicators: false,
  serverExternalPackages: ['pdf-parse', 'mammoth'],
};

export default nextConfig;
