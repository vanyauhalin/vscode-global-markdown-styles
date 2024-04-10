import {mkdtemp} from "node:fs/promises"
import {tmpdir, type} from "node:os"
import {join} from "node:path"
import {test} from "uvu"
import type {Extension} from "vscode"
import type {Library} from "../src/extension.mts"
import {name} from "../package.json"
import {createServer as createNativeServer} from "node:http"

export const win = isWindows() ? test : test.skip
export const dar = isDarwin() ? test : test.skip

export async function createTempDir(): Promise<string> {
  const d = join(tmpdir(), name)
  return mkdtemp(`${d}-`)
}

export function createLibrary(l: any): Library {
  return l as Library
}

export function createExtension(e: any): Extension<any> {
  return e as Extension<any>
}

function isWindows(): boolean {
  return type().startsWith("Windows_NT")
}

function isDarwin(): boolean {
  return type().startsWith("Darwin")
}

export function createServer(): [typeof s, string] {
  const s = createNativeServer()
  s.listen()
  const a = s.address()
  if (typeof a === "string" || a === null) {
    throw new Error("Server address is not available")
  }
  const u = `http://localhost:${a.port}`
  return [s, u]
}
