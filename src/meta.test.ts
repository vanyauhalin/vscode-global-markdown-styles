import {readFile, rm, rmdir, writeFile} from "node:fs/promises"
import {join} from "node:path"
import {equal, is} from "uvu/assert"
import {test} from "uvu"
import {createTempDir} from "../test/shared.ts"
import * as meta from "./meta.ts"

const {createMeta} = meta

test("createMeta() creates a meta object with defaults", () => {
  const a = createMeta()
  equal(a, {version: ""})
})

const {decodeMeta} = meta

test("decodeMeta() decodes the empty meta object", () => {
  const a = decodeMeta("")
  equal(a, {version: ""})
})

test("decodeMeta() decodes the meta object", () => {
  const a = decodeMeta('{"version":"1.0.0"}')
  equal(a, {version: "1.0.0"})
})

const {readMeta} = meta

test("readMeta() reads the meta object", async () => {
  const d = await createTempDir()
  const f = join(d, "0")
  await writeFile(f, '{"version":"1.0.0"}')
  const a = await readMeta(f)
  equal(a, {version: "1.0.0"})
  await rm(f)
  await rmdir(d)
})

const {encodeMeta} = meta

test("encodeMeta() encodes the empty meta object", () => {
  const a = encodeMeta({version: ""})
  is(a, "{}")
})

test("encodeMeta() encodes the meta object", () => {
  const a = encodeMeta({version: "1.0.0"})
  is(a, '{\n  "version": "1.0.0"\n}')
})

const {writeMeta} = meta

test("writeMeta() writes the meta object", async () => {
  const d = await createTempDir()
  const f = join(d, "0")
  await writeMeta(f, {version: "1.0.0"})
  const c = await readFile(f, "utf8")
  is(c, '{\n  "version": "1.0.0"\n}')
  await rm(f)
  await rmdir(d)
})

test.run()
