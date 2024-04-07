import {createHash} from "node:crypto"
import {mkdir, readFile, readdir, rm, rmdir, writeFile} from "node:fs/promises"
import {existsSync} from "node:fs"
import {basename, extname, join, relative} from "node:path"
import {fileURLToPath} from "node:url"
import init, {transform} from "lightningcss-wasm"
import {SemVer} from "semver"
import type {extensions, workspace} from "vscode"
import {version} from "../package.json"
import {backupFile, builtinFile, importsDir, metaFile, rootDir, stateDir} from "./basedir.ts"
import {builtinURL, extensionURL, isFileURL, isHTTPSURL, isHTTPURL, rootURL} from "./baseurl.ts"
import {readConfig, validateConfig} from "./config.ts"
import {createMeta, writeMeta} from "./meta.ts"

export interface Library {
  extensions: typeof extensions
  version: string
  workspace: typeof workspace
}

export async function install(lib: Library): Promise<void> {
  const cfg = readConfig(lib.workspace)

  const er = validateConfig(cfg)
  if (er.length > 0) {
    throw new Error(`Invalid configuration: ${er.join("; ")}`)
  }

  if (cfg.imports.length === 0) {
    throw new Error("No imports specified")
  }

  const n = extensionName(lib.version)
  if (n === "") {
    throw new Error("Could not determine the markdown extension name")
  }

  const id = extensionID(n)

  const md = lib.extensions.getExtension(id)
  if (!md) {
    throw new Error("Could not find the markdown extension")
  }

  const rd = rootDir(md)
  if (!existsSync(rd)) {
    throw new Error("Could not find the markdown extension's styles directory")
  }

  const btf = builtinFile(rd)
  if (!existsSync(btf)) {
    throw new Error("Could not find the markdown extension's builtin styles file")
  }

  const st = stateDir(rd)
  if (!existsSync(st)) {
    await mkdir(st)
  }

  const mf = metaFile(st)
  if (!existsSync(mf)) {
    const m = createMeta()
    m.version = version
    await writeMeta(mf, m)
  }

  const jl: string[] = []

  const pd = importsDir(st)
  if (existsSync(pd)) {
    await rf(pd)
  }
  await mkdir(pd)

  let vd: Validator | undefined
  if (cfg.validation.enabled) {
    vd = await createValidator()
  }

  for (const im of cfg.imports) {
    let c = await readImport(im)
    if (vd) {
      try {
        vd(c)
      } catch (e) {
        let m = ""
        if (e instanceof Error) {
          m = e.message
        }
        throw new Error(`Failed to validate import URL: ${im} (${m})`)
      }
    }
    c = `/* ${im} */\n${c}`
    const h = createSHA(c)
    const f = join(pd, `${h}.css`)
    await writeFile(f, c)
    jl.push(f)
  }

  const bpf = backupFile(st)
  if (!existsSync(bpf)) {
    const c = await readFile(btf, "utf8")
    await writeFile(bpf, c)
  }

  jl.unshift(bpf)

  const jc = createInjection(jl, rd)
  await writeFile(btf, jc)
}

export async function uninstall(lib: Library): Promise<void> {
  const n = extensionName(lib.version)
  if (n === "") {
    throw new Error("Could not determine the markdown extension name")
  }

  const id = extensionID(n)

  const md = lib.extensions.getExtension(id)
  if (!md) {
    throw new Error("Could not find the markdown extension")
  }

  const rd = rootDir(md)
  if (!existsSync(rd)) {
    throw new Error("Could not find the markdown extension's styles directory")
  }

  const st = stateDir(rd)
  if (!existsSync(st)) {
    throw new Error("Could not find the markdown extension's state directory")
  }

  const bp = backupFile(st)
  if (existsSync(bp)) {
    const c = await readFile(bp, "utf8")
    const bt = builtinFile(rd)
    await writeFile(bt, c)
    await rm(bp)
  }

  const pd = importsDir(st)
  if (existsSync(pd)) {
    await rf(pd)
  }

  const mf = metaFile(st)
  if (existsSync(mf)) {
    await rm(mf)
  }

  await rmdir(st)
}

export async function doctor(lib: Library): Promise<void> {
  const n = extensionName(lib.version)
  if (n === "") {
    throw new Error("Could not determine the markdown extension name")
  }

  const id = extensionID(n)

  const md = lib.extensions.getExtension(id)
  if (!md) {
    throw new Error("Could not find the markdown extension")
  }

  const rd = rootDir(md)
  if (!existsSync(rd)) {
    throw new Error("Could not find the markdown extension's styles directory")
  }

  const st = stateDir(rd)
  if (!existsSync(st)) {
    await mkdir(st)
  }

  const mf = metaFile(st)
  const m = createMeta()
  m.version = version
  await writeMeta(mf, m)

  const jl: string[] = []

  const pd = importsDir(st)
  if (existsSync(pd)) {
    const v = await createValidator()
    const pl = await readdir(pd)
    await Promise.all(pl.map(async (n) => {
      const f = join(pd, n)
      const c = await readFile(f, "utf8")
      const h = createSHA(c)
      const e = extname(n)
      const b = basename(n, e)
      if (b !== h) {
        await rm(f)
        return
      }
      try {
        v(c)
        jl.push(f)
      } catch {
        await rm(f)
      }
    }))
  }

  let btu = extensionURL(lib.version, n)
  btu = rootURL(btu)
  btu = builtinURL(btu)
  const btr = await fetch(btu)
  if (!btr.ok) {
    throw new Error()
  }
  const btc = await btr.text()

  const bpf = backupFile(st)
  if (!existsSync(bpf)) {
    await writeFile(bpf, btc)
  } else {
    const c = await readFile(bpf, "utf8")
    if (c !== btc) {
      await writeFile(bpf, btc)
    }
  }

  jl.unshift(bpf)

  const btf = builtinFile(rd)
  const jc = createInjection(jl, rd)
  await writeFile(btf, jc)

  const sl = await readdir(st)
  await Promise.all(sl.map(async (n) => {
    const f = join(st, n)
    if (f !== mf && f !== pd && f !== bpf) {
      await rf(f)
    }
  }))
}

export function extensionID(n: string): string {
  return `vscode.${n}`
}

export function extensionName(v: string): string {
  const s = new SemVer(v)

  // https://github.com/microsoft/vscode/tree/1.22.0/
  let c = s.compare("1.22.0")
  if (c != -1) {
    return "markdown-language-features"
  }

  // https://github.com/microsoft/vscode/tree/1.3.0/
  c = s.compare("1.3.0")
  if (c != -1) {
    return "markdown"
  }

  return ""
}

export async function readImport(u: string): Promise<string> {
  switch (true) {
  case isFileURL(u):
    u = fileURLToPath(u)
    return readFile(u, "utf8")
  case isHTTPURL(u):
  case isHTTPSURL(u):
    const r = await fetch(u)
    if (!r.ok) {
      throw new Error(`Failed to read import URL: ${u} (${r.status} ${r.statusText})`)
    }
    return r.text()
  default:
    throw new Error(`Invalid import URL: ${u}`)
  }
}

export function createInjection(files: string[], root: string): string {
  let c = ""
  for (const f of files) {
    const p = relative(root, f)
    c += `@import "${p}";\n`
  }
  return c
}

export type Validator = Awaited<ReturnType<typeof createValidator>>

export async function createValidator() {
  await init()
  return function validate(c: string): void {
    transform({
      filename: "",
      code: Buffer.from(c)
    })
  }
}

export function createSHA(c: string): string {
  return createHash("sha256").update(c).digest("hex")
}

export async function rf(p: string): Promise<void> {
  await rm(p, {recursive: true, force: true})
}
