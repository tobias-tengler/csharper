import { RelativePattern, WorkspaceFolder } from "vscode";
import * as vscode from "vscode";
import * as path from "path";
import { getTextFromFile } from "./helpers";

export async function getProjectFileUris(workspaceFolder: WorkspaceFolder) {
  const relativePattern = new RelativePattern(workspaceFolder, "**/*.csproj");

  const uris = await vscode.workspace.findFiles(relativePattern);

  if (!uris || uris.length < 1) {
    throw new Error("No C# projects could be found in the selected workspace");
  }

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

  if (nearestProjectFile) {
    return nearestProjectFile;
  }

  return null;
}

export async function getNamespaceFromFile(file: vscode.Uri) {
  const content = await getTextFromFile(file);

  return getNamespaceFromString(content);
}

// todo: handle commented out
function getNamespaceFromString(content: string) {
  const match = /(?:namespace\s([^\s]+))/gm.exec(content);

  if (!match || match.length !== 2) {
    return null;
  }

  return match[1];
}

export async function getRootNamespaceFromProject(projectFile: vscode.Uri) {
  const content = await getTextFromFile(projectFile);

  return getRootNamespaceFromString(content);
}

// todo: handle commented out
function getRootNamespaceFromString(content: string) {
  const match = /(?:<RootNamespace>([^<]+)<\/RootNamespace>)/gm.exec(content);

  if (!match || match.length !== 2) {
    return null;
  }

  return match[1];
}

export function getProjectName(projectFile: vscode.Uri) {
  return path.basename(projectFile.fsPath).replace(".csproj", "").replace(/\W/g, "");
}

export function appendPathSegementsToProjectName(
  projectName: string,
  projectFile: vscode.Uri,
  filepath: vscode.Uri
): string {
  const projectDirectory = path.dirname(projectFile.fsPath);
  const relativePathToFile = path.dirname(filepath.fsPath).replace(projectDirectory, "");

  const pathSegments = relativePathToFile
    .split(path.sep)
    .filter((segement) => !!segement)
    .map((segement) => segement.replace(/\W/g, ""));

  const namespaceParts = [projectName, ...pathSegments];

  return namespaceParts.join(".");
}
