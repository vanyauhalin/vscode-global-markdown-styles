import type {Disposable, ExtensionContext} from "vscode"
import {commands, extensions, version, window, workspace} from "vscode"
import type {Library} from "./extension.ts"
import * as extension from "./extension.ts"
import {name} from "../package.json"

const lib: Library = {extensions, version, workspace}

export function activate(ctx: ExtensionContext): void {
  ctx.subscriptions.push(
    register("install", install),
    register("uninstall", uninstall),
    register("doctor", doctor)
  )
}

function register(n: string, cb: (...args: any[]) => any): Disposable {
  return commands.registerCommand(`${name}.${n}`, cb)
}

async function install() {
  try {
    await extension.install(lib)
  } catch (e) {
    let m = "Unknown error"
    if (e instanceof Error) {
      m = e.message
    }
    m = `Failed to install global styles: ${m}`
    if (!m.endsWith(".")) {
      m += "."
    }
    window.showErrorMessage(m)
    return
  }
  window
    .showInformationMessage(
      "Global styles installed successfully. Please reload the window to apply changes.",
      {title: "Reload Window"}
    )
    .then(reloadWindow)
}

async function uninstall() {
  try {
    await extension.uninstall(lib)
  } catch (e) {
    let m = "Unknown error"
    if (e instanceof Error) {
      m = e.message
    }
    m = `Failed to uninstall global styles: ${m}`
    if (!m.endsWith(".")) {
      m += "."
    }
    window.showErrorMessage(m)
    return
  }
  window
    .showInformationMessage(
      "Global styles uninstalled successfully. Please reload the window to apply changes.",
      {title: "Reload Window"}
    )
    .then(reloadWindow)
}

async function doctor() {
  try {
    await extension.doctor(lib)
  } catch (e) {
    let m = "Unknown error"
    if (e instanceof Error) {
      m = e.message
    }
    m = `Failed to doctor global styles: ${m}`
    if (!m.endsWith(".")) {
      m += "."
    }
    window.showErrorMessage(m)
    return
  }
  window
    .showInformationMessage(
      "Global styles are healthy. Please reload the window to apply changes.",
      {title: "Reload Window"}
    )
    .then(reloadWindow)
}

function reloadWindow(): void {
  commands.executeCommand("workbench.action.reloadWindow")
}
