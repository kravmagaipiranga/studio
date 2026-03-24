import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.janeway.replit.dev', '*.replit.dev'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
    ],
  },
};

export default nextConfig;
