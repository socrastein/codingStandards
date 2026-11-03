import { defineConfig } from "vitest/config";

/** The tests (npm test): every module of the tools, and one run of the whole measuring over the fixture files. */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    environment: "node",
  },
});
