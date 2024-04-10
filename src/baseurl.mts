import {join} from "node:path/posix"

export function extensionURL(v: string, n: string): string {
  let p = join("microsoft/vscode", v, "extensions", n)
  if (!p.endsWith("/")) {
    p += "/"
  }
  const u = new URL(p, "https://raw.githubusercontent.com/")
  return u.toString()
}

export function rootURL(u: string): string {
  const o = new URL("media/", u)
  return o.toString()
}

export function builtinURL(u: string): string {
  const o = new URL("markdown.css", u)
  return o.toString()
}

export function isFileURL(u: string): boolean {
  return u.startsWith("file://")
}

export function isHTTPURL(u: string): boolean {
  return u.startsWith("http://")
}

export function isHTTPSURL(u: string): boolean {
  return u.startsWith("https://")
}
