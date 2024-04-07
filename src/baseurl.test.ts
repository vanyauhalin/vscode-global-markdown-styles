import {is} from "uvu/assert"
import {test} from "uvu"
import * as baseurl from "./baseurl.ts"

const {extensionURL} = baseurl

test("extensionURL() returns the extension URL", () => {
  const a = extensionURL("1.0.0", "id")
  is(a, "https://raw.githubusercontent.com/microsoft/vscode/1.0.0/extensions/id/")
})

const {rootURL} = baseurl

test("rootURL() returns the root URL", () => {
  const a = rootURL("http://localhost/")
  is(a, "http://localhost/media/")
})

const {builtinURL} = baseurl

test("builtinURL() returns the builtin URL", () => {
  const a = builtinURL("http://localhost/")
  is(a, "http://localhost/markdown.css")
})

const {isFileURL} = baseurl

test("isFileURL() recognizes the file URL", () => {
  const a = isFileURL("file://")
  is(a, true)
})

test("isFileURL() ignores non-file URL", () => {
  const a = isFileURL("")
  is(a, false)
})

const {isHTTPURL} = baseurl

test("isHTTPURL() recognizes the HTTP URL", () => {
  const a = isHTTPURL("http://")
  is(a, true)
})

test("isHTTPURL() ignores non-http URL", () => {
  const a = isHTTPURL("")
  is(a, false)
})

const {isHTTPSURL} = baseurl

test("isHTTPSURL() recognizes the HTTPS URL", () => {
  const a = isHTTPSURL("https://")
  is(a, true)
})

test("isHTTPSURL() ignores non-https URL", () => {
  const a = isHTTPSURL("")
  is(a, false)
})

test.run()
