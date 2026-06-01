import { build, context } from "esbuild";
import { copyFile, mkdir, rm, watch as watchFiles } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const root = process.cwd();
const distDir = path.join(root, "dist");
const watchMode = process.argv.includes("--watch");
const packageMode = process.argv.includes("--package");
const packageName = "lineage-capture-extension.zip";

const entries = [
  {
    entryPoint: "src/background/service-worker.ts",
    outfile: "dist/background/service-worker.js"
  },
  {
    entryPoint: "src/content/runway.ts",
    outfile: "dist/content/runway.js"
  },
  {
    entryPoint: "src/options/options.ts",
    outfile: "dist/options/options.js"
  },
  {
    entryPoint: "src/popup/popup.ts",
    outfile: "dist/popup/popup.js"
  }
];

const staticFiles = [
  ["manifest.json", "dist/manifest.json"],
  ["icon-128.png", "dist/icon-128.png"],
  ["src/options/index.html", "dist/options/index.html"],
  ["src/popup/index.html", "dist/popup/index.html"]
];

async function ensureOutputDirs() {
  await mkdir(path.join(distDir, "background"), { recursive: true });
  await mkdir(path.join(distDir, "content"), { recursive: true });
  await mkdir(path.join(distDir, "options"), { recursive: true });
  await mkdir(path.join(distDir, "popup"), { recursive: true });
}

async function copyStatic() {
  await ensureOutputDirs();
  await Promise.all(
    staticFiles.map(([from, to]) => copyFile(path.join(root, from), path.join(root, to)))
  );
}

function buildOptions(entry) {
  return {
    entryPoints: [entry.entryPoint],
    outfile: entry.outfile,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "chrome116",
    sourcemap: false,
    minify: false,
    legalComments: "none"
  };
}

async function buildOnce() {
  await rm(distDir, { recursive: true, force: true });
  await copyStatic();
  await Promise.all(entries.map((entry) => build(buildOptions(entry))));
  console.log("Built LINEAGE Capture extension in apps/extension/dist");
}

async function packageZip() {
  const outputPath = path.join(root, packageName);
  await rm(outputPath, { force: true });
  await new Promise((resolve, reject) => {
    const child = spawn("zip", ["-qr", outputPath, "."], {
      cwd: distDir,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`zip exited with status ${code}`));
    });
  });
  console.log(`Packaged LINEAGE Capture extension at apps/extension/${packageName}`);
}

if (watchMode) {
  await copyStatic();
  const contexts = await Promise.all(entries.map((entry) => context(buildOptions(entry))));
  await Promise.all(contexts.map((ctx) => ctx.watch()));

  const watcher = watchFiles(path.join(root, "src"), { recursive: true });
  void (async () => {
    for await (const event of watcher) {
      if (event.filename?.endsWith(".html")) {
        await copyStatic();
        console.log("Copied extension static files");
      }
    }
  })();

  console.log("Watching LINEAGE Capture extension sources");
} else {
  await buildOnce();
  if (packageMode) {
    await packageZip();
  }
}
