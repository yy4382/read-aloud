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

const TARGETS = {
  workerd: {
    entry: "src/index.ts",
    outdir: "dist-prebuild",
  },
  node: {
    entry: "entries/node.ts",
    outdir: "dist-node",
  },
  vercel: {
    entry: "src/index.ts",
    outdir: "dist-prebuild",
  },
};
const target = args.values.target;
const targetConfig = TARGETS[target];

// build server
await esbuild.build({
  entryPoints: [targetConfig.entry],
  outdir: targetConfig.outdir,
  bundle: true,
  platform: "node",
  format: "esm",
  sourcemap: true,
});
