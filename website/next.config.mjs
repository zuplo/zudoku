/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/demo",
        destination: "https://cdn.zudoku.dev/demo",
      },
      {
        source: "/docs/:path*",
        destination: "https://docs.zudoku.dev/:path*",
      },
      {
        source: "/assets/:path*",
        destination: "https://docs.zudoku.dev/:path*",
      },
      {
        source: "/docs-static/:path*",
        destination: "https://docs.zudoku.dev/:path*",
      },
    ];
  },
};

export default nextConfig;
