import * as vscode from "vscode";
import * as path from "path";

export async function getTextFromFile(file: vscode.Uri) {
  const document = await vscode.workspace.openTextDocument(file);

  return document.getText();
}

export async function getNeighborWithFileExtension(file: vscode.Uri, extension: string) {
  const directory = getDirectoryFromFile(file);

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

export function isFileChildOfDirectory(
  directory: vscode.Uri,
  file: vscode.Uri
): [isChild: boolean, relativePath: string] {
  const fileDirectory = getDirectoryFromFile(file);

  const relativePath = getRelativePath(directory, fileDirectory);

  const isChild = relativePath.startsWith(path.sep) && relativePath !== fileDirectory.fsPath;

  if (isChild) {
    return [true, relativePath];
  }

  return [false, ""];
}

export function getDirectoryFromFile(file: vscode.Uri) {
  const directory = path.dirname(file.fsPath);

  return vscode.Uri.file(directory);
}

export function getDirectoryName(fullpath: vscode.Uri) {
  return path.basename(fullpath.fsPath);
}

export function getRelativePath(parent: vscode.Uri, file: vscode.Uri) {
  return file.fsPath.replace(parent.fsPath, "");
}