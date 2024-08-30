/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/demo",
        destination: "https://cdn.zudoku.dev.com/demo",
      },
    ];
  },
};

export default nextConfig;
