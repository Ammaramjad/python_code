import path from "path";
import { defineConfig } from "vitest/config";

const database = path.resolve(__dirname, "data/test.db");

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    env: {
      DATABASE_URL: `file:${database}`,
      LINE_ENABLED: "false",
      OCR_PROVIDER: "none",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
