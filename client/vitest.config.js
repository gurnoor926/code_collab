
import { mergeConfig, defineConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.js",
      include: ["src/**/*.{test,spec}.{js,jsx}"],
      clearMocks: true,
      restoreMocks: true,
      mockReset: true,
    },
  })
);
