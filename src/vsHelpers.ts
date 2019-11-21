import { IndexableObject } from "./types/IndexableObject";
import {
  TextDocument,
  TextEditor,
  workspace,
  extensions,
  window,
  Position,
  Selection
} from "vscode";

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
