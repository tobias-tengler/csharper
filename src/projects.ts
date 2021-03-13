import { RelativePattern, WorkspaceFolder } from "vscode";
import * as vscode from "vscode";
import * as path from "path";

export async function getProjectFileUris(workspaceFolder: WorkspaceFolder) {
  const relativePattern = new RelativePattern(workspaceFolder, "**/*.csproj");

  const uris = await vscode.workspace.findFiles(relativePattern);

  if (!uris || uris.length < 1) throw new Error("No C# projects could be found in the selected workspace");

  return uris;
}

export function getNearestProjectFile(projectFiles: vscode.Uri[], origin: vscode.Uri) {
  let nearestProjectFile: vscode.Uri | null = null;
  let nearestProjectFileSubstringLength = origin.fsPath.length;

  for (const projectFile of projectFiles) {
    const projectFileDir = path.dirname(projectFile.fsPath);

    const substringLength = origin.fsPath.replace(projectFileDir, "").length;

    if (substringLength < nearestProjectFileSubstringLength) {
      nearestProjectFile = projectFile;
      nearestProjectFileSubstringLength = substringLength;
    }
  }

  if (nearestProjectFile) return nearestProjectFile;

  return null;
}

export function getProjectNamespace(projectFile: string, filepath: string): string {
  const rootNamespace = path.basename(projectFile).replace(".csproj", "");

  const rootDirectory = path.dirname(projectFile);
  let fileDirectory = path.dirname(filepath).replace(rootDirectory, "");

  if (fileDirectory.length <= 1) {
    return rootNamespace;
  }

  if (fileDirectory.startsWith(path.sep)) {
    fileDirectory = fileDirectory.substring(1);
  }

  return rootNamespace + "." + fileDirectory.replace(path.sep, ".");
}
