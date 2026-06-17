/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remotion's server-side packages (used in the /api/render route) pull in
  // native/esbuild deps that must stay external to the Next.js server bundle.
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/lambda",
  ],
  // Uploaded videos can be large; allow generous body size on server actions.
  experimental: {
    serverActions: {
      bodySizeLimit: "512mb",
    },
  },
};

export default nextConfig;
