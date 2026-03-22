# javascript--spidermonkey--run-button README

This is a simple extension that adds a play/run button to the top right of the editor window. When you click the button, the current file is run in the terminal using the `js` command. This is useful for running JavaScript files in the terminal using the SpiderMonkey JavaScript engine.

## Requirements
This extension requires the SpiderMonkey JavaScript engine to be installed on your system and on the path. A command 'Install and Setup Spidermonkey' is provided in the command palette to help you install SpiderMonkey.

# github
https://github.com/zachtsch/js-spidermoney-vs-code-extension

# Install and Setup Spidermonkey

This command will install SpiderMonkey on your system and add it to your path.  It behaves differently depending on your operating system.

## Windows
Downloads jsshell-win64.zip from https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/ and unzips it in `C:\spidermonkey`. Then it updates your **user** `Path` so future terminals can find `js`. Finally it removes the `.zip` file.

If you already had VS Code or a terminal open, you may need to open a new terminal or restart VS Code before `js` is available as a plain command there.

## Mac
Installs Homebrew, adds `brew` to your path and then runs `brew install spidermonkey`.  Requires your password.  Leaves Homebrew installed.

## Linux
Automated installation from this extension is unsupported at this time. Please install SpiderMonkey manually. 
