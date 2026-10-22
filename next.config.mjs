/** @type {import('next').NextConfig} */
const nextConfig = {
  // Product photos are served straight from the retailers' CDNs.
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default nextConfig;
