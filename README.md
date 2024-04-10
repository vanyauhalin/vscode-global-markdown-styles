<p align="center">
  <picture>
    <source width="100" media="(prefers-color-scheme: dark)" srcset="https://github.com/vanyauhalin/vscode-global-markdown-styles/blob/main/docs/logo.dark.webp">
    <source width="100" media="(prefers-color-scheme: light)" srcset="https://github.com/vanyauhalin/vscode-global-markdown-styles/blob/main/docs/logo.light.webp">
    <img width="100" src="https://github.com/vanyauhalin/vscode-global-markdown-styles/blob/main/docs/logo.light.webp" alt="Asterisk as a logo">
  </picture>
</p>
<br>

# Global Markdown Styles

Starting around version 1.22, the VS Code team [decided to restrict](https://github.com/microsoft/vscode/issues/45260/#issuecomment-371428889) the application of global styles to Markdown file previews, primarily due to security reasons. While this might seem inconvenient, it is a sensible precaution. The team [suggests creating your own extension](https://github.com/microsoft/vscode/issues/45260/#issuecomment-371438399) with the necessary styles as a workaround. Alternatively, you can manually copy the styles from one workspace to another or [create a symbolic link](https://github.com/microsoft/vscode/issues/45260/#issuecomment-385917347) between them. Admittedly, these solutions not be the most convenient. Hence, this extension was developed, despite potential risks, to bring back a user-friendly experience.

> [!TIP]
>
> **If you have found this extension helpful, show your support!** \
> Give the project a star on GitHub or rate it on the marketplace. Thank you!

## How It Works

VS Code includes an extension that features a file with default styles for previewing markdown files. Global Markdown Styles extension enhances this file by adding custom styles to the existing default ones. The extension keeps a backup of the default styles, which can be handy when you need to uninstall the extension or "heal" it.

It is important to mention that since the addition of custom styles involves modifying VS Code's internal files, these changes will be lost with each update. Consequently, you will need to execute the installation command after every update.

Since the extension enhances the default styles, it is compatible with all other extensions that introduce their own styles, like the [Markdown Preview Github Styling](https://github.com/mjbvz/vscode-github-markdown-preview-style/).

The extension lacks a logger. Instead, it utilizes [notifications](https://code.visualstudio.com/api/ux-guidelines/notifications/) to relay information regarding the command status or errors. Therefore, it recommends enabling notifications before executing any command.

> [!WARNING]
> To reiterate, this extension modifies the VS Code source code. Please use it responsibly and at your own risk. Strongly advise against installing styles from unverified sources.

## Requirements

The [`package.json`](https://github.com/vanyauhalin/vscode-global-markdown-styles/blob/main/package.json/#L47) file in the extension indicates compatibility with VS Code 1.22 and later. However, this might be a bit too optimistic. Rest assured, the extension works with the latest VS Code versions (1.87 at the time of writing), but compatibility with much earlier versions is not guaranteed. If you encounter any issues with your version, kindly open an issue.

For the extension to function properly, VS Code needs self-modification permissions. This implies that the user launching the editor should have the necessary permissions to edit the VS Code source code.

### MacOS

Claim ownership of the command:

```sh
sudo chown -R "$(whoami)" "$(command -v code)"
```

... and the application:

```sh
sudo chown -R "$(whoami)" "$(osascript -e 'POSIX path of (path to application "Visual Studio Code")')"
```

### Linux

Claim ownership of the command:

```sh
sudo chown -R "$(whoami)" "$(command -v code)"
```

... and the application:

```sh
sudo chown -R "$(whoami)" "/usr/share/code"
```

The application path may vary depending on your distribution or package manager.

### Windows

Just run the application as an administrator before executing the extension commands.

## Installation

The extension is available on the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=vanyauhalin.global-markdown-styles) and [Open VSX Registry](https://open-vsx.org/extension/vanyauhalin/global-markdown-styles/). Additionally, you can manually download it from the [GitHub Releases](https://github.com/vanyauhalin/vscode-global-markdown-styles/releases/).

## Configuration

- `global-markdown-styles.http.enabled`, `boolean`, optional

  The extension is set up to not allow file downloads via HTTP by default. This is a [security measure](https://www.cloudflare.com/learning/ssl/why-is-http-not-secure/). If possible, strongly recommend avoiding HTTP connections.

- `global-markdown-styles.validation.enabled`, `boolean`, optional

  Under the hood, the extension employs [Lightning CSS](https://github.com/parcel-bundler/lightningcss/) for validation. This setting is enabled by default.

- `global-markdown-styles.imports`, `array of URLs`, required

  List of URLs for styles that need to be installed. Each item in the array should be an HTTP(S) URL without [redirection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections/), or an absolute [File URL](https://www.wikiwand.com/en/File_URI_scheme/). The order in which these URLs are listed is significant, as it mirrors the [`@import`](https://developer.mozilla.org/en-US/docs/Web/CSS/@import/) order in CSS.

- `markdown.styles`, `array of URLs`, required

  The extension supports the setting provided by VS Code. However,  remember that this setting has lower priority when compared to the extension's custom setting.

## Commands

- `global-markdown-styles.install`

  The install command installs the imports mentioned in the settings.

- `global-markdown-styles.uninstall`

  The uninstall command uninstalls the imports mentioned in the settings.

- `global-markdown-styles.doctor`, require internet connection

  Ideally, you would not find yourself needing to use the doctor command. This command will try to "heal" the files that the extension works with. Specifically, it checks the integrity of backup and imported styles and validates them.

## Contribution

Are welcome! See [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/).

## Acknowledgments

I would like to thank [Renzhi Li](https://github.com/be5invis/) for his [Custom CSS and JS](https://github.com/be5invis/vscode-custom-css) extension. It has been a source of inspiration and has led me to experiment.

## License

[MIT](https://github.com/vanyauhalin/vscode-global-markdown-styles/blob/main/LICENSE/) (c) [Ivan Uhalin](https://github.com/vanyauhalin/)

<br>
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/vanyauhalin/vscode-global-markdown-styles/blob/main/docs/footer.dark.webp">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/vanyauhalin/vscode-global-markdown-styles/blob/main/docs/footer.light.webp">
    <img src="https://github.com/vanyauhalin/vscode-global-markdown-styles/blob/main/docs/footer.light.webp" alt="Huge asterisk on the footer banner">
  </picture>
</p>
