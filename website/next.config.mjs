/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects() {
    return [
      {
        source: "/docs",
        destination: "/docs/introduction",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/demo",
        destination: "https://cdn.zudoku.dev/demo",
      },
      {
        source: "/introduction",
        destination: "https://docs.zudoku.dev/introduction",
      },
      {
        source: "/docs/:path*",
        destination: "https://docs.zudoku.dev/docs/:path*",
      },
      {
        source: "/assets/:path*",
        destination: "https://docs.zudoku.dev/assets/:path*",
      },
      {
        source: "/docs-static/:path*",
        destination: "https://docs.zudoku.dev/docs-static/:path*",
      },
    ];
  },
};

export default nextConfig;
