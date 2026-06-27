import { cp, mkdir, rm } from "node:fs/promises";
import { build } from "esbuild";

const staticFiles = [
  "index.html",
  "styles.css",
  "game.js",
  "learning.js",
  "sound.js",
  "icp-config.js",
  "404.html",
  "favicon.svg",
];

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

for (const file of staticFiles) {
  try {
    await cp(file, `dist/${file}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

await build({
  entryPoints: ["icp.js"],
  outfile: "dist/icp.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  minify: true,
  sourcemap: true,
});

console.log("Built ICP frontend into dist/");
