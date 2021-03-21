import { newFileFromCommand } from "./actions/newFile";
import * as vscode from "vscode";

export const extensionChannel = vscode.window.createOutputChannel("CSharper");

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("csharper.newFile", async (args) => {
      try {
        await newFileFromCommand(args?.fsPath);
      } catch (error) {
        extensionChannel.appendLine(error);
      }
    })
  );

  extensionChannel.appendLine("Activated");
}
