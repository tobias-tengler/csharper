import { TextDocument, TextEditor, extensions, window, workspace, Disposable } from "vscode";
import { TemplateFile } from "./types/TemplateFile";
import * as fs from "fs";
import * as path from "path";

function getFocusedDocument() {
  const focusedDocument = window.activeTextEditor?.document;

  if (focusedDocument && !focusedDocument.isUntitled) return focusedDocument;

  return null;
}

async function getSelectedWorkspace() {
  const focusedDocument = getFocusedDocument();

  if (focusedDocument) {
    const workspaceFromDocument = workspace.getWorkspaceFolder(focusedDocument.uri);

    if (workspaceFromDocument) return workspaceFromDocument;
  }

  const workspaces = workspace.workspaceFolders;

  if (!workspaces) throw new Error("Workspaces could not be determined");

  if (workspaces.length === 1) return workspaces[0];

  const selectedWorkspace = await window.showWorkspaceFolderPick({ ignoreFocusOut: true });

  if (!selectedWorkspace) throw new Error("Selected workspace could not be determined");

  return selectedWorkspace;
}

export async function selectDirectory() {
  const disposables: Disposable[] = [];

  try {
    return await new Promise<string>(async (resolve, reject) => {
      const workspace = await getSelectedWorkspace();

      const quickpick = window.createQuickPick<TemplateFile>();
      quickpick.ignoreFocusOut = true;
      quickpick.canSelectMany = false;
      quickpick.title = "New C# File";
      quickpick.placeholder = `Search for directory in workspace '${workspace.name}'`;
      quickpick.step = 1;
      quickpick.totalSteps = 3;

      // todo: implement

      disposables.push(
        quickpick.onDidHide(() => {
          reject();
          quickpick.dispose();
        })
      );

      quickpick.show();
    });
  } finally {
    disposables.map((disposable) => disposable.dispose());
  }
}

export async function selectTemplate(templates: TemplateFile[], fromContext: boolean) {
  const disposables: Disposable[] = [];

  try {
    return await new Promise<TemplateFile>((resolve, reject) => {
      const quickpick = window.createQuickPick<TemplateFile>();
      quickpick.ignoreFocusOut = true;
      quickpick.canSelectMany = false;
      quickpick.title = "New C# File";
      quickpick.step = fromContext ? 1 : 2;
      quickpick.totalSteps = fromContext ? 2 : 3;
      quickpick.items = templates;

      disposables.push(
        quickpick.onDidChangeSelection((items) => {
          const firstItem = items[0];

          if (firstItem) {
            resolve(firstItem);
            quickpick.hide();
          }
        })
      );

      disposables.push(
        quickpick.onDidHide(() => {
          reject();
          quickpick.dispose();
        })
      );

      quickpick.show();
    });
  } finally {
    disposables.map((disposable) => disposable.dispose());
  }
}

export async function selectFilename(directoryPath: string, fromContext: boolean) {
  const disposables: Disposable[] = [];

  try {
    return await new Promise<string>((resolve, reject) => {
      let selectedFileName: string;
      let error: boolean;

      const input = window.createInputBox();
      input.ignoreFocusOut = true;
      input.prompt = "Please enter a name for your file";
      input.title = "New C# File";
      input.step = fromContext ? 2 : 3;
      input.totalSteps = fromContext ? 2 : 3;

      disposables.push(
        input.onDidChangeValue((value) => {
          if (value) {
            if (!/^[a-zA-Z0-9_]+$/.test(value)) {
              input.validationMessage = "Name contains invalid characters";
              error = true;

              return;
            }

            const filepath = path.join(directoryPath, value + ".cs");

            if (fs.existsSync(filepath)) {
              input.validationMessage = "File already exists";
              error = true;

              return;
            }
          }

          selectedFileName = value;
          input.validationMessage = undefined;
          error = false;
        })
      );

      disposables.push(
        input.onDidAccept(() => {
          if (!selectedFileName || error) return;

          resolve(selectedFileName);
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
