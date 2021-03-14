import { Disposable, Uri } from "vscode";
import { TITLE, TOTAL_STEPS } from "../constants";
import * as vscode from "vscode";
import * as fs from "fs";

type FileResult = [filename: string, filepath: Uri];

export async function selectFile(directory: Uri, isInterface: boolean) {
  const disposables: Disposable[] = [];

  try {
    return await new Promise<FileResult>((resolve, reject) => {
      let filename: string;
      let fileUri: Uri;
      let error: boolean;

      const input = vscode.window.createInputBox();
      input.ignoreFocusOut = true;
      input.prompt = "Enter a Filename";
      input.placeholder = "Filename";
      input.title = TITLE;
      input.step = 4;
      input.totalSteps = TOTAL_STEPS;

      disposables.push(
        input.onDidChangeValue((value) => {
          if (value) {
            const firstCharacter = value[0];

            if (firstCharacter !== firstCharacter.toUpperCase()) {
              value = value[0].toUpperCase() + value.slice(1);

              input.value = value;
            } else if (isInterface && value.length > 1 && value[0] !== "I") {
              value = "I" + value;

              input.value = value;
            }

            if (!/^[a-zA-Z0-9_]+$/.test(value)) {
              input.validationMessage = "Name contains invalid characters";
              error = true;

              return;
            }

            fileUri = Uri.joinPath(directory, value + ".cs");

            if (fs.existsSync(fileUri.fsPath)) {
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

          resolve([filename, fileUri]);
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
