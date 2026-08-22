import { defineConfig } from "prisma/config";

// Replaces the deprecated `package.json#prisma` config block (removed in
// Prisma 7). Also removes a footgun: that deprecation warning printed to
// stderr, and once corrupted a migration file when a `2>&1` redirect
// merged it into `prisma migrate diff`'s stdout SQL output.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node prisma/seed.mjs",
  },
});
