import { newFile } from "./actions/newFile";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const channel = vscode.window.createOutputChannel("CSharper");

  context.subscriptions.push(
    vscode.commands.registerCommand("csharper.newFile", async (args) => {
      try {
        await newFile(channel, args?.fsPath);
      } catch (error) {
        channel.appendLine(error);
      }
    })
  );

  channel.appendLine("Activated");
}
