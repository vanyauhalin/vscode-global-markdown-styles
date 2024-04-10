import {copyFile, mkdir} from "node:fs/promises"
import {existsSync} from "node:fs"
import {createRequire} from "node:module"
import {basename, dirname, join} from "node:path"
import {argv} from "node:process"
import {URL, fileURLToPath} from "node:url"
import esbuild from "esbuild"
import sade from "sade"

main()

function main(): void {
  sade("./makefile.mts")
    .command("build")
    .action(build)
    .parse(argv)
}

async function build(): Promise<void> {
  const rd = rootDir()

  const dd = distDir(rd)
  if (!existsSync(dd)) {
    await mkdir(dd)
  }

  const sd = sourceDir(rd)
  const sf = sourceFile(sd)
  const df = distFile(dd)
  const pl = polyfill()
  await esbuild.build({
    banner: pl.banner,
    bundle: true,
    define: pl.define,
    entryPoints: [sf],
    external: ["vscode"],
    format: "cjs",
    outfile: df,
    platform: "node"
  })

  const wd = wasmDir()
  const wf = wasmFile(wd)
  await copyWasm(wf, dd)
}

function rootDir(): string {
  const u = new URL(".", import.meta.url)
  return fileURLToPath(u)
}

function distDir(d: string): string {
  return join(d, "dist")
}

function distFile(d: string): string {
  return join(d, "extension.js")
}

function sourceDir(d: string): string {
  return join(d, "src")
}

function sourceFile(d: string): string {
  return join(d, "main.mts")
}

function wasmDir(): string {
  const r = createRequire(import.meta.url)
  const f = r.resolve("lightningcss-wasm")
  return dirname(f)
}

function wasmFile(d: string): string {
  return join(d, "lightningcss_node.wasm")
}

function copyWasm(f: string, d: string): Promise<void> {
  let t = basename(f)
  t = join(d, t)
  return copyFile(f, t)
}

function polyfill() {
  return {
    banner: {
      js:
        `"use strict";\n` +
        `var import_meta_url = require("url").pathToFileURL(__filename).toString();\n`
    },
    define: {
      "import.meta.url": "import_meta_url"
    }
  }
}
