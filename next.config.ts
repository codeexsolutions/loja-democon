import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita processos auxiliares que falham no ambiente local do Windows.
  experimental: { workerThreads: process.env.NODE_ENV === "development" },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
