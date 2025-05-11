import { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  experimental: {
    // @ts-expect-error - Missing type definition for lightningcss in the NextConfig type
    css: {
      lightningcss: false
    }
  },
  // Fallback compiler options in case swc/lightningcss has issues
  swcMinify: true
};

export default nextConfig;
