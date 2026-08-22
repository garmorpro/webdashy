import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal, self-contained server bundle for the Docker image
  // (see Dockerfile) — copies only the files needed to run `next start`,
  // not the full node_modules tree.
  output: "standalone",
};

export default nextConfig;
