import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
        pathname: "/coins/**",
      },
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
        pathname: "/coins/**",
      },
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
        pathname: "/nft_contracts/**",
      },
    ],
  },
};

export default nextConfig;
