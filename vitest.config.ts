import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Focused tests for the money paths only: the payment guard, FX pricing, and
 * on-chain log selection. Everything else is covered by `npm run build`.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
