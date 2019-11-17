import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("csharper.newFile", newFile)
  );
}

export function deactivate() {}

function newFile(args: any) {
  vscode.window
    .showInputBox({
      ignoreFocusOut: true,
      prompt: "Please enter a filename"
    })
    .then(input => {
      if (!input) {
        return;
      }

      const filepath = getFilePath(args.fsPath, getFilename(input));

      if (fs.existsSync(filepath)) {
        vscode.window.showErrorMessage("File already exists");
        return;
      }

      console.log(filepath);
    });
}

function getFilename(filename: string) {
  if (path.extname(filename) !== ".cs") {
    if (filename.endsWith(".")) {
      return filename + "cs";
    }

    return filename + ".cs";
  }

  return filename;
}

function getFilePath(dir: string, filename: string) {
  return dir + path.sep + filename;
}
