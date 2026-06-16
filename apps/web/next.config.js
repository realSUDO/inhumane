/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return {
      // Fallback rewrites only apply when no page/api route matches
      fallback: [
        {
          source: "/api/:path*",
          destination: `${process.env.INTERNAL_API_URL || "http://localhost:8000"}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
