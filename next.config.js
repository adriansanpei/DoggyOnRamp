/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  webpack: (config, { dir }) => {
    // Exclude bot folder from Next.js build
    config.exclude.push(/bot\//);
    return config;
  },
};
module.exports = nextConfig;
