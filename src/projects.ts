import { RelativePattern, WorkspaceFolder } from "vscode";
import * as vscode from "vscode";
import * as path from "path";
import { getTextFromFile, isFileChildOfDirectory } from "./helpers";

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

export async function getRootNamespaceFromProject(projectFile: vscode.Uri) {
  const content = await getTextFromFile(projectFile);

  return getRootNamespaceFromString(content);
}

// todo: i don't like using regex for this sort of stuff
export function getNamespaceFromString(content: string) {
  const removedComments = content.replace(/(\/\*(.|[\r\n])*?\*\/|\/\/.*$)/gm, "");

  const match = /(?:namespace\s([^\s]+))/gm.exec(removedComments);

  if (!match || match.length !== 2) {
    return null;
  }

  return match[1] || null;
}

export function getRootNamespaceFromString(content: string) {
  const removedComments = content.replace(/<!--(.|[\r\n])*?-->/gm, "");

  const match = /(?:<RootNamespace>([^<]+)<\/RootNamespace>)/gm.exec(removedComments);

  if (!match || match.length !== 2) {
    return null;
  }

  return match[1] || null;
}

export function getProjectName(projectFile: vscode.Uri) {
  const filename = path.basename(projectFile.fsPath).replace(".csproj", "");

  return replaceInvalidNamespaceCharacters(filename) || null;
}

export function appendPathSegementsToProjectName(
  projectName: string,
  projectFile: vscode.Uri,
  filepath: vscode.Uri
): string {
  const projectDirectory = path.dirname(projectFile.fsPath);
  const [isChild, relativePath] = isFileChildOfDirectory(projectDirectory, filepath.fsPath);

  if (!isChild) {
    return projectName;
  }

  const pathSegments = relativePath
    .split(path.sep)
    .filter((segement) => !!segement)
    .map(replaceInvalidNamespaceCharacters);

  if (pathSegments.length < 1) {
    return projectName;
  }

  const namespaceParts = [projectName, ...pathSegments];

  return namespaceParts.join(".");
}

function replaceInvalidNamespaceCharacters(input: string) {
  return input.replace(/[^a-zA-Z0-9\.]/g, "");
}
