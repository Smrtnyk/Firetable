/* eslint-disable no-console */
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const entryFile = path.resolve(dirname, "dist/src/index.js");
const outputDir = path.resolve(dirname, "dist-esbuild");

build({
    entryPoints: [entryFile],
    bundle: true,
    minify: false,
    sourcemap: false,
    outfile: path.join(outputDir, "bundle.js"),
    platform: "browser",
    target: ["esnext"],
    format: "iife",
    globalName: "FT",
    splitting: false,
})
    .then(() => {
        console.log("Build successful!");
    })
    .catch((error) => {
        console.error("Build failed:", error);
        globalThis.process.exit(1);
    });
