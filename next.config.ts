import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: process.env.BUNDLE_MAPS === "1",
  // site 100 % estático — GitHub Pages / qualquer host de ficheiros
  output: "export",
};

export default nextConfig;
