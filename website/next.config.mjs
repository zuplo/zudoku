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
        source: "/docs/:path*",
        destination: "https://docs.zudoku.dev/docs/:path*",
      },
    ];
  },
};

export default nextConfig;
