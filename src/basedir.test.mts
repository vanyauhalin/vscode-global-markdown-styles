import {is} from "uvu/assert"
import {test} from "uvu"
import {createExtension} from "../test/shared.mts"
import {name} from "../package.json"
import * as basedir from "./basedir.mts"

const {rootDir} = basedir

test("rootDir() returns the root directory", () => {
  const e = createExtension({extensionPath: "/"})
  const a = rootDir(e)
  is(a, "/media")
})

const {stateDir} = basedir

test("stateDir() returns the state directory", () => {
  const a = stateDir("/")
  is(a, `/${name}`)
})

const {metaFile} = basedir

test("metaFile() returns the meta file path", () => {
  const a = metaFile("/")
  is(a, "/meta.json")
})

const {builtinFile} = basedir

test("builtinFile() returns the builtin file path", () => {
  const a = builtinFile("/")
  is(a, "/markdown.css")
})

const {backupFile} = basedir

test("backupFile() returns the backup file path", () => {
  const a = backupFile("/")
  is(a, "/backup.css")
})

const {importsDir} = basedir

test("importsDir() returns the imports directory", () => {
  const a = importsDir("/")
  is(a, "/imports")
})

test.run()
