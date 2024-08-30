/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/demo",
        destination: "https://cdn.zudoku.dev/demo",
      },
    ];
  },
};

export default nextConfig;
