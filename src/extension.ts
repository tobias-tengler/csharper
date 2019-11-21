import * as vscode from "vscode";
import newFile from "./actions/newFile";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "csharper.newFile",
      async args => await newFile(args?.fsPath)
    )
  );
}

export function deactivate() {}
