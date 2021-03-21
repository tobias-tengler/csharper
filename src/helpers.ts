import * as vscode from "vscode";
import * as path from "path";

export async function getTextFromFile(file: vscode.Uri) {
  const document = await vscode.workspace.openTextDocument(file);

  return document.getText();
}

export async function getNeighborWithFileExtension(file: vscode.Uri, extension: string) {
  const directory = vscode.Uri.file(path.dirname(file.fsPath));

  const files = await vscode.workspace.fs.readDirectory(directory);

  const filesWithExtension = files.filter(
    ([filename, type]) => type === vscode.FileType.File && filename.endsWith(extension)
  );

  if (!filesWithExtension || filesWithExtension.length < 1) {
    return null;
  }

  const [filename] = filesWithExtension[0];

  return vscode.Uri.joinPath(directory, filename);
}

export function isFileChildOfDirectory(directory: string, file: string): [isChild: boolean, relativePath: string] {
  const fileDirectory = path.dirname(file);

  const relativePath = fileDirectory.replace(directory, "");

  const isChild = relativePath.startsWith(path.sep) && relativePath !== fileDirectory;

  if (isChild) {
    return [true, relativePath];
  }

  return [false, ""];
}
