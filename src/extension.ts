import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('javascript--spidermonkey--run-button.run', () => {
    // Get the active text editor
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const document = editor.document;
      const filePath = document.fileName;

      // Get the current terminal or create a new one if none exists
      let terminal = vscode.window.activeTerminal;
      if (!terminal) {
        terminal = vscode.window.createTerminal(`Run: ${filePath}`);
      }

      // Focus on the terminal and run the file
      terminal.show();
      terminal.sendText(`js "${filePath}"`);  // For example, if you are running *.js files
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
