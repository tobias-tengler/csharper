import { IndexableObject } from "./types/IndexableObject";
import {
  TextDocument,
  TextEditor,
  workspace,
  extensions,
  window,
  Position,
  Selection,
  WorkspaceFolder
} from "vscode";

export function getWorkspaceFolders(): WorkspaceFolder[] | null {
  const workspaceFolders = workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length < 1) {
    return null;
  }

  return workspaceFolders;
}

export function getWorkspaceFolderUris(): string[] | null {
  const workspaceFolders = getWorkspaceFolders();

  if (workspaceFolders === null) {
    return null;
  }

  return workspaceFolders.map(i => i.uri.fsPath);
}

export function getRootPath(): string | null {
  const workspaceFolders = getWorkspaceFolders();

  if (workspaceFolders === null) {
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
    extensions.getExtension("tobiastengler.csharper")?.extensionPath ?? null
  );
}

export async function selectTemplate(
  templates: IndexableObject
): Promise<string | null> {
  const templateNames = Object.keys(templates);

  let selectedTemplateName: string | undefined;

  try {
    selectedTemplateName = await window.showQuickPick(templateNames, {
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
    selectedFileName = await window.showInputBox({
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

export async function openDocument(filepath: string): Promise<TextDocument> {
  return await workspace.openTextDocument(filepath);
}

export async function showDocument(document: TextDocument) {
  await window.showTextDocument(document);
}

export async function showDocumentFromFile(
  filePath: string
): Promise<TextEditor> {
  const document = await openDocument(filePath);

  return await window.showTextDocument(document);
}

export function setCursorPosition(editor: TextEditor, position: Position) {
  editor.selection = new Selection(position, position);
}

export function displayError(text: string, modal: boolean = true) {
  window.showErrorMessage(text, {
    modal
  });
}

export function displayWarning(text: string, modal: boolean = true) {
  window.showWarningMessage(text, {
    modal
  });
}
