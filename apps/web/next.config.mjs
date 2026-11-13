import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    if (!isServer) {
      const existing = config.optimization.splitChunks?.cacheGroups ?? {};
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...existing,
          // Keep leaflet out of shared sync chunks — it's only needed on
          // /innisfree and /members/map (both load it via dynamic import)
          leaflet: {
            test: /node_modules[\\/]leaflet/,
            chunks: 'async',
            name: 'leaflet',
            enforce: true,
            priority: 30,
          },
        },
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'osiramhnynhwmlfyuqcp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'osiramhnynhwmlfyuqcp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/**',
      },
      {
        protocol: 'https',
        hostname: 'ezndphlcgeonbfgelzjd.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net',
      },
    ],
  },
  transpilePackages: ['@bayou/ui', '@bayou/supabase'],
  // Legacy static-site paths from before the Next.js rebuild. These 404'd silently
  // for months: Meta's app config still pointed at /privacy.html, so Meta could not
  // find a privacy policy and DISABLED the Facebook app — which took Facebook sign-in
  // down (no successful facebook auth since 2026-07-29) with no notification that
  // reached anyone. Anything else still linking the old paths (Search Console,
  // directories, old emails, printed material) hits the same dead end.
  // 308 permanent so external configs and crawlers update their target.
  async redirects() {
    return [
      { source: '/privacy.html', destination: '/privacy', permanent: true },
      { source: '/terms.html', destination: '/terms', permanent: true },
      { source: '/about.html', destination: '/about', permanent: true },
      { source: '/donate.html', destination: '/donate', permanent: true },
      { source: '/volunteer.html', destination: '/volunteer', permanent: true },
      { source: '/gallery.html', destination: '/gallery', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
      // No /contact route exists in the rebuild — send it somewhere useful
      // rather than to another 404.
      { source: '/contact.html', destination: '/volunteer', permanent: true },
    ];
  },
};

export default withBundleAnalyzer(withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'bayou-charity',
  project: process.env.SENTRY_PROJECT || 'bayou-web',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
}));
