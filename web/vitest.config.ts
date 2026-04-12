import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["scripts/**/*.test.ts", "src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@lib": resolve(__dirname, "src/lib"),
      "@layouts": resolve(__dirname, "src/layouts"),
      "@components": resolve(__dirname, "src/components"),
    },
  },
});
