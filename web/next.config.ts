import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '..'),
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = config.resolve.alias ?? {};
    config.resolve.alias['@meblomat/prisma'] = path.join(
      __dirname,
      '..',
      'prisma',
      'client.ts',
    );
    return config;
  },
};

export default nextConfig;
