import {isAbsolute} from "node:path"
import {fileURLToPath} from "node:url"
import type {workspace} from "vscode"
import {name} from "../package.json"
import {isFileURL, isHTTPSURL, isHTTPURL} from "./baseurl.ts"

export interface Config {
  http: ConfigToggle
  imports: string[]
  validation: ConfigToggle
}

export interface ConfigToggle {
  enabled: boolean
}

export function createConfig(): Config {
  return {
    http: {
      enabled: false
    },
    imports: [],
    validation: {
      enabled: true
    }
  }
}

export function readConfig(w: typeof workspace): Config {
  const c = createConfig()

  let wc = w.getConfiguration(name)

  let e = wc.get<boolean>("http.enabled")
  if (e !== undefined) {
    c.http.enabled = e
  }

  let im = wc.get<string[]>("imports")
  if (im !== undefined) {
    c.imports = im
  }

  e = wc.get<boolean>("validation.enabled")
  if (e !== undefined) {
    c.validation.enabled = e
  }

  // https://github.com/microsoft/vscode/blob/1.3.0/extensions/markdown/package.json/#L118
  wc = w.getConfiguration("markdown")

  im = wc.get<string[]>("styles")
  if (im !== undefined) {
    c.imports = [...im, ...c.imports]
  }

  return c
}

export function validateConfig(cfg: Config): string[] {
  const errs: string[] = []

  for (const im of cfg.imports) {
    switch (true) {
    case isFileURL(im):
      try {
        const u = fileURLToPath(im)
        if (!isAbsolute(u)) {
          errs.push(`The file URL must be absolute, but "${u}" is not"`)
        }
      } catch (err) {
        let m = `The file URL ${im} is invalid`
        if (err instanceof Error) {
          m = err.message
        }
        errs.push(m)
      }
      break

    case isHTTPURL(im):
      if (!cfg.http.enabled) {
        errs.push(`The HTTP URL is not allowed, but "${im}" is provided`)
      }
      break

    case isHTTPSURL(im):
      break
    default:
      errs.push(`The URL scheme "${im}" is not supported`)
      break
    }
  }

  return errs
}
