/** @type {import('next').NextConfig} */
const nextConfig = {
  // Product photos are served straight from the retailers' CDNs.
  images: { unoptimized: true },
  poweredByHeader: false,
  // Inlined so client components build the same Amazon Associates links (lib/amazon.ts).
  env: { AMAZON_AU_TAG: process.env.AMAZON_AU_TAG || "compareempire-22" },
  // `npm run typecheck` is the type gate; LOCAL_SKIP_TYPECHECK=1 is for quick local builds only.
  typescript: { ignoreBuildErrors: process.env.LOCAL_SKIP_TYPECHECK === "1" },
};
export default nextConfig;
