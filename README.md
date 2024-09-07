# javascript--spidermonkey--run-button README

This is a simple extension that adds a play/run button to the top right of the editor window. When you click the button, the current file is run in the terminal using the `js` command. This is useful for running JavaScript files in the terminal using the SpiderMonkey JavaScript engine.

## Requirements
This extension requires the SpiderMonkey JavaScript engine to be installed on your system and on the path. A command 'Install and Setup Spidermonkey' is provided in the command palette to help you install SpiderMonkey.

# github
https://github.com/zachtsch/js-spidermoney-vs-code-extension

# Install and Setup Spidermonkey

## Windows
Downloads jsshell-win64.zip from https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/ and unzips it in C:\spidermonkey.  Then add C:\spidermonkey to your path.

## Mac
Installs Homebrew, adds `brew` to your path and then runs `brew install spidermonkey`.  Requires your password.

## Linux
You're on your own as I trust you know how to install software via command line on your system.