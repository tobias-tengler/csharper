import * as vscode from "vscode";
import { IndexableObject } from "./types/IndexableObject";

export function getRootPath(): string | null {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length < 1) {
    return null;
  }

  const firstWorkspaceFolder = workspaceFolders[0];

  if (workspaceFolders.length > 1) {
    displayWarning(
      `More than one Workspace Folder. Defaulting to \"${firstWorkspaceFolder.name}\"`,
      false
    );
  }

  return workspaceFolders[0].uri.fsPath ?? null;
}

export function getExtensionPath(): string | null {
  return (
    vscode.extensions.getExtension("tobiastengler.csharper")?.extensionPath ??
    null
  );
}

export async function selectTemplate(
  templates: IndexableObject
): Promise<string | null> {
  const templateNames = Object.keys(templates);

  let selectedTemplateName: string | undefined;

  try {
    selectedTemplateName = await vscode.window.showQuickPick(templateNames, {
      ignoreFocusOut: true
    });
  } catch (error) {
    console.error(error);
  }

  if (!selectedTemplateName) {
    return null;
  }

  return templates[selectedTemplateName] ?? null;
}

export async function selectFilename(): Promise<string | null> {
  let selectedFileName: string | undefined;

  try {
    selectedFileName = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      prompt: "Please enter a name"
    });
  } catch (error) {
    console.error(error);
  }

  if (!selectedFileName) {
    return null;
  }

  return selectedFileName;
}

export function displayError(text: string, modal: boolean = true) {
  vscode.window.showErrorMessage(text, {
    modal
  });
}

export function displayWarning(text: string, modal: boolean = true) {
  vscode.window.showWarningMessage(text, {
    modal
  });
}
