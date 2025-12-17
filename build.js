// @ts-check

import * as esbuild from "esbuild";
import { parseArgs } from "node:util";

const args = parseArgs({
  options: {
    target: {
      type: "string",
    },
    debug: {
      type: "boolean",
      default: false,
    },
  },
  allowPositionals: false,
  strict: true,
});
/**
 * @type {Record<string, import("esbuild").BuildOptions>}
 */
const TARGETS = {
  workerd: {
    entryPoints: ["src/index.ts"],
    outdir: "dist-prebuild",
    platform: "browser",
    external: ["node:*"],
  },
  node: {
    entryPoints: ["entries/node.ts"],
    outdir: "dist-node",
    platform: "node",
    packages: "external",
  },
  vercel: {
    entryPoints: ["src/index.ts"],
    outdir: "dist-prebuild",
    platform: "node",
    packages: "external",
  },
};

const target = args.values.target;
if (!target) {
  throw new Error("target is required");
}
const targetConfig = TARGETS[target];

// // build server
await esbuild.build({
  bundle: true,
  format: "esm",
  sourcemap: true,
  ...targetConfig,
});
