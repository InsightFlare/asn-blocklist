import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/entries/index.ts",
    runtime: "src/entries/runtime.ts",
    "hosting/ef": "src/entries/hosting-ef.ts",
    "hosting/gr": "src/entries/hosting-gr.ts",
    "access/ef": "src/entries/access-ef.ts",
    "access/gr": "src/entries/access-gr.ts",
    "data/hosting-ef": "src/entries/data/hosting-ef.ts",
    "data/hosting-gr": "src/entries/data/hosting-gr.ts",
    "data/access-ef": "src/entries/data/access-ef.ts",
    "data/access-gr": "src/entries/data/access-gr.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: false,
  target: "es2020",
  outDir: "lib",
});
