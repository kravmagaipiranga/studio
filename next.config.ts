import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.janeway.replit.dev', '*.replit.dev'],
  serverExternalPackages: ['firebase-admin'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Explicitly forward these secrets so Next.js API routes can read them.
  // process.env is evaluated at startup time when all Replit secrets are present.
  env: {
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL ?? '',
    GOOGLE_PRIVATE_KEY:  process.env.GOOGLE_PRIVATE_KEY  ?? '',
    FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
                      || process.env.GCLOUD_PROJECT
                      || 'studio-659171913-ed391',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yata-apix-c1ca31d6-cb5d-4e4c-94a2-7c6a7dc7c677.s3-object.locaweb.com.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
