// frontend/next.config.js
/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    headers: [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ],
    images: {
      remotePatterns: [
        {
          protocol: "http",
          hostname: "localhost",
          pathname: "/**",
        },
      ],
    },
    // Configuration du proxy API pour le développement
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: process.env.NEXT_PUBLIC_API_URL + '/api/:path*',
        },
      ];
    },
    assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  };
  
  module.exports = nextConfig;