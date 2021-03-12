import { TextDocument, TextEditor, workspace, extensions, window } from "vscode";
import { TemplateFile } from "./types/TemplateFile";
import * as fs from "fs";
import * as path from "path";
import { fileNameRegex } from "./constants";

export function getExtensionPath(): string | null {
  return extensions.getExtension("tobiastengler.csharper")?.extensionPath ?? null;
}

export async function selectTemplate(templates: TemplateFile[]) {
  return new Promise<TemplateFile>((resolve, reject) => {
    const quickpick = window.createQuickPick<TemplateFile>();
    quickpick.ignoreFocusOut = true;
    quickpick.canSelectMany = false;
    quickpick.title = "New C# File";
    quickpick.step = 1;
    quickpick.totalSteps = 2;
    quickpick.items = templates;
    quickpick.onDidChangeSelection((items) => {
      const firstItem = items[0];

      if (firstItem) {
        resolve(firstItem);
        quickpick.hide();
      }
    });
    quickpick.onDidHide(reject);

    quickpick.show();
  });
}

export async function selectFilename(directoryPath: string) {
  return new Promise<string>((resolve, reject) => {
    let selectedFileName: string;
    let error: boolean;

    const inputBox = window.createInputBox();
    inputBox.ignoreFocusOut = true;
    inputBox.prompt = "Please enter a name for your file";
    inputBox.title = "New C# File";
    inputBox.step = 2;
    inputBox.totalSteps = 2;
    inputBox.onDidChangeValue((value) => {
      if (value) {
        if (!fileNameRegex.test(value)) {
          inputBox.validationMessage = "Name contains invalid characters";
          error = true;

          return;
        }

        const filepath = path.join(directoryPath, value + ".cs");

        if (fs.existsSync(filepath)) {
          inputBox.validationMessage = "File already exists";
          error = true;

          return;
        }
      }

      selectedFileName = value;
      inputBox.validationMessage = undefined;
      error = false;
    });
    inputBox.onDidAccept(() => {
      if (!selectedFileName || error) return;

      resolve(selectedFileName);
      inputBox.hide();
    });
    inputBox.onDidHide(reject);

    inputBox.show();
  });
}

export async function openDocument(filepath: string): Promise<TextDocument> {
  return await workspace.openTextDocument(filepath);
}

export async function showDocument(document: TextDocument) {
  await window.showTextDocument(document);
}

export async function showDocumentFromFile(filePath: string): Promise<TextEditor> {
  const document = await openDocument(filePath);

  return await window.showTextDocument(document);
}
