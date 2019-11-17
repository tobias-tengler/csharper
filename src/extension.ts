import * as vscode from "vscode";
import { newFileAction } from "./actions";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("csharper.newFile", newFileAction)
  );
}

export function deactivate() {}
