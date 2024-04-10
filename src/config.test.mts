import {equal} from "uvu/assert"
import {test} from "uvu"
import {createLibrary, dar, win} from "../test/shared.mts"
import {name} from "../package.json"
import * as config from "./config.mts"

const {createConfig} = config

test("createConfig() creates a config object with defaults", () => {
  const a = createConfig()
  equal(a, {
    http: {
      enabled: false
    },
    imports: [],
    validation: {
      enabled: true
    }
  })
})

const {readConfig} = config

test("readConfig() reads the empty config object", async () => {
  const lib = createLibrary({
    workspace: {
      getConfiguration() {
        return {
          get() {}
        }
      }
    }
  })
  const a = readConfig(lib.workspace)
  equal(a, createConfig())
})

test("readConfig() reads the config object", async () => {
  const lib = createLibrary({
    workspace: {
      getConfiguration(n: string) {
        switch (n) {
        case name:
          return {
            get(n: string) {
              switch (n) {
              case "http.enabled":
                return true
              case "imports":
                return ["f", "u"]
              case "validation.enabled":
                return false
              default:
                return
              }
            }
          }
        default:
          return {
            get() {}
          }
        }
      }
    }
  })
  const a = readConfig(lib.workspace)
  const e = createConfig()
  e.http.enabled = true
  e.imports = ["f", "u"]
  e.validation.enabled = false
  equal(a, e)
})

test("readConfig() respects the builtin config object", async () => {
  const lib = createLibrary({
    workspace: {
      getConfiguration(n: string) {
        switch (n) {
        case name:
          return {
            get(n: string) {
              switch (n) {
              case "imports":
                return ["f"]
              default:
                return
              }
            }
          }
        case "markdown":
          return {
            get(n: string) {
              switch (n) {
              case "styles":
                return ["u"]
              default:
                return
              }
            }
          }
        default:
          return {
            get() {}
          }
        }
      }
    }
  })
  const a = readConfig(lib.workspace)
  const e = createConfig()
  e.imports = ["u", "f"]
  equal(a, e)
})

const {validateConfig} = config

win("validateConfig() returns an error for non-absolute Windows import", () => {
  const c = createConfig()
  c.imports = ["file://.css"]
  const a = validateConfig(c)
  equal(a, ['The file URL must be absolute, but ".css" is not"'])
})

dar("validateConfig() returns an error for non-absolute Darwin import", () => {
  const c = createConfig()
  c.imports = ["file://.css"]
  const a = validateConfig(c)
  equal(a, ['File URL host must be \"localhost\" or empty on darwin'])
})

test("validateConfig() returns an error for disallowed http import", () => {
  const c = createConfig()
  c.imports = ["http://localhost/"]
  const a = validateConfig(c)
  equal(a, [`The HTTP URL is not allowed, but "${c.imports[0]}" is provided`])
})

test("validateConfig() does not return an error for allowed http import", () => {
  const c = createConfig()
  c.http.enabled = true
  c.imports = ["http://localhost/"]
  const a = validateConfig(c)
  equal(a, [])
})

test("validateConfig() returns an error for unsupported import", () => {
  const c = createConfig()
  c.imports = ["ftp://localhost/"]
  const a = validateConfig(c)
  equal(a, [`The URL scheme "${c.imports[0]}" is not supported`])
})

test.run()
