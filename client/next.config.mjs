/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.API_INTERNAL_URL ?? "http://localhost:5010";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        // Imagens de produtos servidas pelo backend via UseStaticFiles
        source: "/imagens/:path*",
        destination: `${backendUrl}/imagens/:path*`,
      },
    ];
  },
};

export default nextConfig;
