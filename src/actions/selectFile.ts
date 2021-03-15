import { Disposable, Uri } from "vscode";
import { CSHARP_KEYWORDS, TITLE, TOTAL_STEPS } from "../constants";
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
          input.validationMessage = undefined;
          error = false;

          if (!value) {
            input.validationMessage = "Filename can not be empty";
            error = true;

            return;
          }

          if (!/^[a-zA-Z0-9_\/]+$/.test(value)) {
            input.validationMessage = "Filename contains invalid characters";
            error = true;

            return;
          }

          const pathSegments = value.replace(/^\/+/, "").replace(/\/+$/, "").split("/");

          if (pathSegments.some((pathSegment) => CSHARP_KEYWORDS.includes(pathSegment))) {
            input.validationMessage = "Filename contains reserved C# keywords";
            error = true;

            return;
          }

          const lastSegmentIndex = pathSegments.length - 1;
          const leadingPathSegments = pathSegments.slice(0, lastSegmentIndex);

          filename = withNamingRules(pathSegments[lastSegmentIndex], isInterface);
          fileUri = Uri.joinPath(directory, ...leadingPathSegments, filename + ".cs");

          if (fs.existsSync(fileUri.fsPath)) {
            input.validationMessage = "File already exists";
            input.value = fileUri.fsPath.replace(directory.fsPath, "").replace(/^\/+/, "").replace(/\.cs$/, "");
            error = true;

            return;
          }
        })
      );

      disposables.push(
        input.onDidAccept(() => {
          if (!filename || error) {
            return;
          }

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
