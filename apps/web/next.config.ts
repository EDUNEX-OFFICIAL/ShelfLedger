import type { NextConfig } from 'next';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

// Monorepo: load root `.env` when running from apps/web
loadEnv({ path: resolve(__dirname, '../../.env') });
loadEnv({ path: resolve(__dirname, '.env') });

const nextConfig: NextConfig = {
  output: 'standalone',
  // Monorepo: trace files from repo root (pnpm + workspace packages)
  outputFileTracingRoot: resolve(__dirname, '../..'),
  transpilePackages: [
    '@shelfledger/db',
    '@shelfledger/domain',
    '@shelfledger/errors',
    '@shelfledger/validators',
  ],
};

export default nextConfig;
