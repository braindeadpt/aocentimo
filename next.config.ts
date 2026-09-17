import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // site 100 % estático — GitHub Pages / qualquer host de ficheiros
  output: "export",
};

export default nextConfig;
