import {mkdir, readFile, writeFile} from "node:fs/promises"
import {existsSync} from "node:fs"
import {join} from "node:path"
import {pathToFileURL} from "node:url"
import {equal, instance, is, ok, unreachable} from "uvu/assert"
import {test} from "uvu"
import {createExtension, createLibrary, createServer, createTempDir} from "../test/shared.mts"
import {version} from "../package.json"
import {backupFile, builtinFile, importsDir, metaFile, rootDir, stateDir} from "./basedir.mts"
import * as extension from "./extension.mts"
import {readMeta, writeMeta} from "./meta.mts"

const {rf} = extension

test("rf() removes recursively", async () => {
  const d = await createTempDir()
  const f = join(d, "0")
  await writeFile(f, "")
  await rf(d)
  ok(!existsSync(d))
})

const {createSHA} = extension

test("createSHA() returns the SHA-256 hash", () => {
  const h = createSHA("content")
  is(h, "ed7002b439e9ac845f22357d822bac1444730fbdb6016d3ec9432297b9ec9f73")
})

const {createValidator} = extension

test("validate() does not throw for valid content", async () => {
  const v = await createValidator()
  try {
    v("a {}")
  } catch {
    unreachable()
  }
})

test("validate() throws for invalid content", async () => {
  const v = await createValidator()
  try {
    v("a }")
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, "Unexpected end of input")
  }
})

const {createInjection} = extension

test("createInjection() returns the injection", () => {
  const i = createInjection(["/a", "/c/b"], "/c")
  is(i, `@import "../a";\n@import "b";\n`)
})

const {readImport} = extension

test("readImport() reads the file URL", async () => {
  const d = await createTempDir()
  const f = join(d, "0")
  await writeFile(f, "content")
  const u = pathToFileURL(f)
  const c = await readImport(u.toString())
  is(c, "content")
  await rf(d)
})

test("readImport() reads the http URL", async () => {
  const [s, u] = createServer()

  s.on("request", (_, res) => {
    res.end("content")
  })

  const c = await readImport(u)
  is(c, "content")

  s.close()
})

test("readImport() throws if the http URL fails", async () => {
  const [s, u] = createServer()

  s.on("request", (_, res) => {
    res.statusCode = 404
    res.end()
  })

  try {
    await readImport(u)
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, `Failed to read import URL: ${u} (404 Not Found)`)
  }

  s.close()
})

test("readImport() throws for unsupported URL", async () => {
  try {
    await readImport("ftp://localhost/")
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, "Invalid import URL: ftp://localhost/")
  }
})

const {extensionName} = extension

test("extensionName() returns the modern extension name", () => {
  const id = "markdown-language-features"

  let n = extensionName("1.22.1")
  is(n, id)

  n = extensionName("1.22.0")
  is(n, id)
})

test("extensionName() returns the legacy extension name", () => {
  const id = "markdown"

  let n = extensionName("1.3.1")
  is(n, id)

  n = extensionName("1.3.0")
  is(n, id)
})

const {extensionID} = extension

test("extensionID() returns the extension ID", () => {
  const id = extensionID("name")
  is(id, "vscode.name")
})

const {install} = extension

test("install() throws if the configuration is invalid", async () => {
  const lib = createLibrary({
    version: "1.22.0",
    workspace: {
      getConfiguration() {
        return {
          get(n: string) {
            switch (n) {
            case "imports":
              return ["ftp://localhost/a", "ftp://localhost/b"]
            default:
              return
            }
          }
        }
      }
    }
  })

  try {
    await install(lib)
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, 'Invalid configuration: The URL scheme "ftp://localhost/a" is not supported; The URL scheme "ftp://localhost/b" is not supported')
  }
})

test("install() thrown if no imports are specified", async () => {
  const lib = createLibrary({
    version: "1.22.0",
    workspace: {
      getConfiguration() {
        return {
          get() {
            return []
          }
        }
      }
    }
  })

  try {
    await install(lib)
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, "No imports specified")
  }
})

test("install() throws if could not determine the markdown extension name", async () => {
  const lib = createLibrary({
    version: "1.2.0",
    workspace: {
      getConfiguration() {
        return {
          get(n: string) {
            switch (n) {
            case "imports":
              return ["https://localhost/"]
            default:
              return
            }
          }
        }
      }
    }
  })

  try {
    await install(lib)
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, "Could not determine the markdown extension name")
  }
})

test("install() throws if could not find the markdown extension", async () => {
  const lib = createLibrary({
    extensions: {
      getExtension() {}
    },
    version: "1.22.0",
    workspace: {
      getConfiguration() {
        return {
          get(n: string) {
            switch (n) {
            case "imports":
              return ["https://localhost/"]
            default:
              return
            }
          }
        }
      }
    }
  })

  try {
    await install(lib)
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, "Could not find the markdown extension")
  }
})

test("install() throws if could not find the markdown extension's styles directory", async () => {
  const d = await createTempDir()

  const md = createExtension({extensionPath: d})

  const lib = createLibrary({
    extensions: {
      getExtension() {
        return md
      }
    },
    version: "1.22.0",
    workspace: {
      getConfiguration() {
        return {
          get(n: string) {
            switch (n) {
            case "imports":
              return ["https://localhost/"]
            default:
              return
            }
          }
        }
      }
    }
  })

  try {
    await install(lib)
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, "Could not find the markdown extension's styles directory")
  }

  await rf(d)
})

test("install() throws if could not find the markdown extension's builtin styles file", async () => {
  const d = await createTempDir()

  const md = createExtension({extensionPath: d})

  const rd = rootDir(md)
  await mkdir(rd)

  const lib = createLibrary({
    extensions: {
      getExtension() {
        return md
      }
    },
    version: "1.22.0",
    workspace: {
      getConfiguration() {
        return {
          get(n: string) {
            switch (n) {
            case "imports":
              return ["https://localhost/"]
            default:
              return
            }
          }
        }
      }
    }
  })

  try {
    await install(lib)
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, "Could not find the markdown extension's builtin styles file")
  }

  await rf(d)
})

test("install() reads the previous meta object", async () => {
  const d = await createTempDir()

  const uf = join(d, "user.css")
  await writeFile(uf, "")

  const uu = pathToFileURL(uf)

  const md = createExtension({extensionPath: d})

  const rd = rootDir(md)
  await mkdir(rd)

  const btf = builtinFile(rd)
  await writeFile(btf, "")

  const st = stateDir(rd)
  await mkdir(st)

  const mf = metaFile(st)
  const m = {version: "x"}
  await writeMeta(mf, m)

  const lib = createLibrary({
    extensions: {
      getExtension() {
        return md
      }
    },
    version: "1.22.0",
    workspace: {
      getConfiguration() {
        return {
          get(n: string) {
            switch (n) {
            case "imports":
              return [uu.toString()]
            default:
              return
            }
          }
        }
      }
    }
  })

  await install(lib)

  const c = await readMeta(mf)
  equal(c, m)

  await rf(d)
})

test("install() deletes the previous imports directory", async () => {
  const d = await createTempDir()

  const uf = join(d, "user.css")
  await writeFile(uf, "")

  const uu = pathToFileURL(uf)

  const md = createExtension({extensionPath: d})

  const rd = rootDir(md)
  await mkdir(rd)

  const btf = builtinFile(rd)
  await writeFile(btf, "")

  const st = stateDir(rd)
  await mkdir(st)

  const pd = importsDir(st)
  await mkdir(pd)

  const pf = join(pd, "0.css")
  await writeFile(pf, "")

  const lib = createLibrary({
    extensions: {
      getExtension() {
        return md
      }
    },
    version: "1.22.0",
    workspace: {
      getConfiguration() {
        return {
          get(n: string) {
            switch (n) {
            case "imports":
              return [uu.toString()]
            default:
              return
            }
          }
        }
      }
    }
  })

  await install(lib)

  ok(!existsSync(pf))

  await rf(d)
})

test("install() throws if validation fails", async () => {
  const d = await createTempDir()

  const uf = join(d, "user.css")
  await writeFile(uf, "a }")

  const uu = pathToFileURL(uf)

  const md = createExtension({extensionPath: d})

  const rd = rootDir(md)
  await mkdir(rd)

  const btf = builtinFile(rd)
  await writeFile(btf, "")

  const lib = createLibrary({
    extensions: {
      getExtension() {
        return md
      }
    },
    version: "1.22.0",
    workspace: {
      getConfiguration() {
        return {
          get(n: string) {
            switch (n) {
            case "imports":
              return [uu.toString()]
            default:
              return
            }
          }
        }
      }
    }
  })

  try {
    await install(lib)
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, `Failed to validate import URL: ${uu} (Unexpected end of input)`)
  }

  await rf(d)
})

test("install() installs the file URL styles", async () => {
  const d = await createTempDir()

  const uf = join(d, "user.css")
  await writeFile(uf, "a {}")

  const uu = pathToFileURL(uf)

  const md = createExtension({extensionPath: d})

  const rd = rootDir(md)
  await mkdir(rd)

  const btf = builtinFile(rd)
  await writeFile(btf, "body {}")

  const lib = createLibrary({
    extensions: {
      getExtension() {
        return md
      }
    },
    version: "1.22.0",
    workspace: {
      getConfiguration() {
        return {
          get(n: string) {
            switch (n) {
            case "imports":
              return [uu.toString()]
            default:
              return
            }
          }
        }
      }
    }
  })

  await install(lib)

  const st = stateDir(rd)

  const mf = metaFile(st)
  const m = await readMeta(mf)
  equal(m, {version})

  const jl: string[] = []

  const pd = importsDir(st)
  const ph = createSHA(`/* ${uu} */\na {}`)
  const pf = join(pd, `${ph}.css`)
  const pc = await readFile(pf, "utf8")
  is(pc, `/* ${uu} */\na {}`)
  jl.push(pf)

  const bpf = backupFile(st)
  const bpc = await readFile(bpf, "utf8")
  is(bpc, "body {}")
  jl.unshift(bpf)

  const jc = createInjection(jl, rd)
  const btc = await readFile(btf, "utf8")
  is(btc, jc)

  await rf(d)
})

test("install() installs the http URL styles", async () => {
  const d = await createTempDir()

  const [s, u] = createServer()

  s.on("request", (_, res) => {
    res.end("a {}")
  })

  const md = createExtension({extensionPath: d})

  const rd = rootDir(md)
  await mkdir(rd)

  const btf = builtinFile(rd)
  await writeFile(btf, "body {}")

  const lib = createLibrary({
    extensions: {
      getExtension() {
        return md
      }
    },
    version: "1.22.0",
    workspace: {
      getConfiguration() {
        return {
          get(n: string) {
            switch (n) {
            case "http.enabled":
              return true
            case "imports":
              return [u]
            default:
              return
            }
          }
        }
      }
    }
  })

  await install(lib)

  const st = stateDir(rd)

  const mf = metaFile(st)
  const m = await readMeta(mf)
  equal(m, {version})

  const jl: string[] = []

  const pd = importsDir(st)
  const ph = createSHA(`/* ${u} */\na {}`)
  const pf = join(pd, `${ph}.css`)
  const pc = await readFile(pf, "utf8")
  is(pc, `/* ${u} */\na {}`)
  jl.push(pf)

  const bpf = backupFile(st)
  const bpc = await readFile(bpf, "utf8")
  is(bpc, "body {}")
  jl.unshift(bpf)

  const jc = createInjection(jl, rd)
  const btc = await readFile(btf, "utf8")
  is(btc, jc)

  s.close()
  await rf(d)
})

test("install() installs the styles without validation", async () => {
  const d = await createTempDir()

  const uf = join(d, "user.css")
  await writeFile(uf, "a }")

  const uu = pathToFileURL(uf)

  const md = createExtension({extensionPath: d})

  const rd = rootDir(md)
  await mkdir(rd)

  const btf = builtinFile(rd)
  await writeFile(btf, "")

  const lib = createLibrary({
    extensions: {
      getExtension() {
        return md
      }
    },
    version: "1.22.0",
    workspace: {
      getConfiguration() {
        return {
          get(n: string) {
            switch (n) {
            case "imports":
              return [uu.toString()]
            case "validation.enabled":
              return false
            default:
              return
            }
          }
        }
      }
    }
  })

  await install(lib)

  const st = stateDir(rd)

  const pd = importsDir(st)
  const ph = createSHA(`/* ${uu} */\na }`)
  const pf = join(pd, `${ph}.css`)
  const pc = await readFile(pf, "utf8")
  is(pc, `/* ${uu} */\na }`)

  await rf(d)
})

const {uninstall} = extension

test("uninstall() throws if could not determine the markdown extension name", async () => {
  const lib = createLibrary({
    version: "1.2.0"
  })

  try {
    await uninstall(lib)
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, "Could not determine the markdown extension name")
  }
})

test("uninstall() throws if could not find the markdown extension", async () => {
  const lib = createLibrary({
    extensions: {
      getExtension() {}
    },
    version: "1.22.0"
  })

  try {
    await uninstall(lib)
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, "Could not find the markdown extension")
  }
})

test("uninstall() throws if could not find the markdown extension's styles directory", async () => {
  const d = await createTempDir()

  const md = createExtension({extensionPath: d})

  const lib = createLibrary({
    extensions: {
      getExtension() {
        return md
      }
    },
    version: "1.22.0"
  })

  try {
    await uninstall(lib)
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, "Could not find the markdown extension's styles directory")
  }

  await rf(d)
})

test("uninstall() throws if could not find the markdown extension's state directory", async () => {
  const d = await createTempDir()

  const md = createExtension({extensionPath: d})

  const rd = rootDir(md)
  await mkdir(rd)

  const lib = createLibrary({
    extensions: {
      getExtension() {
        return md
      }
    },
    version: "1.22.0"
  })

  try {
    await uninstall(lib)
    unreachable()
  } catch (e) {
    let m = ""
    if (e instanceof Error) {
      m = e.message
    }
    instance(e, Error)
    is(m, "Could not find the markdown extension's state directory")
  }

  await rf(d)
})

test("uninstall() removes the styles", async () => {
  const d = await createTempDir()

  const uf = join(d, "user.css")
  await writeFile(uf, "a {}")

  const uu = pathToFileURL(uf)

  const md = createExtension({extensionPath: d})

  const rd = rootDir(md)
  await mkdir(rd)

  const btf = builtinFile(rd)
  await writeFile(btf, "body {}")

  const lib = createLibrary({
    extensions: {
      getExtension() {
        return md
      }
    },
    version: "1.22.0",
    workspace: {
      getConfiguration() {
        return {
          get(n: string) {
            switch (n) {
            case "imports":
              return [uu.toString()]
            default:
              return
            }
          }
        }
      }
    }
  })

  await install(lib)
  await uninstall(lib)

  const st = stateDir(rd)
  ok(!existsSync(st))

  const btc = await readFile(btf, "utf8")
  is(btc, "body {}")

  await rf(d)
})

test.run()
