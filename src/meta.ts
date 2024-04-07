import {readFile, writeFile} from "fs/promises"

export interface Meta {
  version: string
}

export function createMeta(): Meta {
  return {
    version: ""
  }
}

export async function readMeta(f: string): Promise<Meta> {
  const c = await readFile(f, "utf8")
  return decodeMeta(c)
}

export function decodeMeta(c: string): Meta {
  const m = createMeta()
  try {
    const o = JSON.parse(c) as unknown
    if (typeof o !== "object" || o === null) {
      return m
    }
    if ("version" in o && typeof o.version === "string") {
      m.version = o.version
    }
  } catch {}
  return m
}

export async function writeMeta(f: string, m: Meta): Promise<void> {
  const c = encodeMeta(m)
  await writeFile(f, c)
}

export function encodeMeta(m: Meta): string {
  const o: Partial<Meta> = structuredClone(m)
  if (o.version === "") {
    delete o.version
  }
  return JSON.stringify(o, null, 2)
}
