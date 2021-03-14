import { Disposable, Uri } from "vscode";
import { TITLE, TOTAL_STEPS } from "../constants";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

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
          input.validationMessage = undefined;
          error = false;

          if (!value) {
            filename = "";
            return;
          }

          if (!/^[a-zA-Z0-9_\/]+$/.test(value)) {
            input.validationMessage = "Name contains invalid characters";
            error = true;

            return;
          }

          // todo: pathsegments should not be csharp keywords
          const pathSegments = value.replace(/^\/+/, "").replace(/\/+$/, "").split("/");

          if (pathSegments.length === 1) {
            filename = pathSegments[0];
            fileUri = Uri.joinPath(directory, pathSegments[0] + ".cs");
          } else {
            filename = pathSegments[pathSegments.length - 1];
            const filepath = path.join(directory.fsPath, ...pathSegments) + ".cs";

            fileUri = Uri.file(filepath);
          }

          if (fs.existsSync(fileUri.fsPath)) {
            input.validationMessage = "File already exists";
            error = true;

            return;
          }
        })
      );

      disposables.push(
        input.onDidAccept(() => {
          if (!filename || error) return;

          filename = withNamingRules(filename, isInterface);

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

function withNamingRules(filename: string, isInterface: boolean) {
  filename = filename[0].toUpperCase() + filename.slice(1);

  if (isInterface && filename.length > 2) {
    if (filename[0] !== "I" || filename[1] !== filename[1].toUpperCase()) {
      filename = "I" + filename;
    }
  }

  return filename;
}
