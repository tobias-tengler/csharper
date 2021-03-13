import { Disposable, Uri } from "vscode";
import { TITLE, TOTAL_STEPS } from "../constants";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

type FileResult = [filename: string, filepath: Uri];

export async function selectFile(directory: Uri) {
  const disposables: Disposable[] = [];

  try {
    return await new Promise<FileResult>((resolve, reject) => {
      let filename: string;
      let filepath: string;
      let error: boolean;

      const input = vscode.window.createInputBox();
      input.ignoreFocusOut = true;
      input.prompt = "Enter a Filename (without an extension)";
      input.title = TITLE;
      input.step = 4;
      input.totalSteps = TOTAL_STEPS;

      disposables.push(
        input.onDidChangeValue((value) => {
          if (value) {
            if (!/^[a-zA-Z0-9_]+$/.test(value)) {
              input.validationMessage = "Name contains invalid characters";
              error = true;

              return;
            }

            filepath = path.join(directory.fsPath, value + ".cs");

            if (fs.existsSync(filepath)) {
              input.validationMessage = "File already exists";
              error = true;

              return;
            }
          }

          filename = value;
          input.validationMessage = undefined;
          error = false;
        })
      );

      disposables.push(
        input.onDidAccept(() => {
          if (!filename || error) return;

          resolve([filename, Uri.parse(filepath)]);
          input.hide();
        })
      );

      disposables.push(
        input.onDidHide(() => {
          reject();
          input.dispose();
        })
      );

      input.show();
    });
  } finally {
    disposables.map((disposable) => disposable.dispose());
  }
}
