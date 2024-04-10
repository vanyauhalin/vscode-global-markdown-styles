import {join} from "node:path"
import type {Extension} from "vscode"
import {name} from "../package.json"

export function rootDir<T>(e: Extension<T>): string {
  return join(e.extensionPath, "media")
}

export function stateDir(d: string): string {
  return join(d, name)
}

export function metaFile(d: string): string {
  return join(d, "meta.json")
}

export function builtinFile(d: string): string {
  return join(d, "markdown.css")
}

export function backupFile(d: string): string {
  return join(d, "backup.css")
}

export function importsDir(d: string): string {
  return join(d, "imports")
}
