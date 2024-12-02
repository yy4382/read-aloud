import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["entries/node.ts"],
  loader: {
    ".html": "text",
  },
  splitting: false,
  sourcemap: !!options.watch,
  clean: true,
  format: "esm",
  outDir: "dist-node",
  noExternal: options.watch ? undefined : [/(.*)/],
}));
