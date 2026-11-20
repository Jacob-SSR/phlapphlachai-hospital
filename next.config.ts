import type { NextConfig } from "next";
const config: NextConfig = {
  images: { unoptimized: true },
  serverExternalPackages: ["pg"],
};
export default config;
