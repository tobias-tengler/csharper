import { OutputChannel, Uri } from "vscode";
import {
  getDirectoryFromFile,
  getNeighborWithFileExtension,
  getTextFromFile,
  getUriOfFocusedDocument,
} from "../helpers";
import * as vscode from "vscode";
import { getWorkspaceFromUri, selectWorkspace } from "./selectWorkspace";
import {
  appendPathSegementsToProjectName,
  getNamespaceFromFile,
  getNearestProjectFile,
  getProjectFileUris,
  getProjectName,
  getRootNamespaceFromProject,
} from "../projects";
import { selectProject } from "./selectProject";
import { selectDirectory } from "./selectDirectory";
import { getTemplates } from "../templates";
import { selectTemplate } from "./selectTemplate";
import { selectFile } from "./selectFile";
import { PathItem } from "../types/PathItem";
import { TextEncoder } from "node:util";
import { EOL } from "os";
import { extensionChannel, getConfiguration } from "../extension";

export function newFileFromCommand(directoryPathFromContextMenu?: string) {
  if (directoryPathFromContextMenu) {
    return newFileFromContextMenu(directoryPathFromContextMenu);
  }

  const respectFocusedDocument = getConfiguration<boolean>("respectFocusedDocument", true);

  const focusedDocumentUri = getUriOfFocusedDocument();

  if (respectFocusedDocument && focusedDocumentUri) {
    return newFileFromFocusedDocument(focusedDocumentUri);
  }

  return newFileFromScratch(focusedDocumentUri);
}

export async function newFileFromContextMenu(directoryPath: string) {
  const directory = Uri.file(directoryPath);

  const workspace = await getWorkspaceFromUri(directory);

  if (!workspace) {
    throw new Error("Workspace could not be determined.");
  }

  const projectFiles = await getProjectFileUris(workspace);

  const projectFile = getNearestProjectFile(projectFiles, directory);

  if (!projectFile) {
    vscode.window.showWarningMessage("C# project file could not be determined");

    throw new Error("Project file could not be determined.");
  }

  return await newFileFromDirectory(projectFile, directory);
}

export async function newFileFromFocusedDocument(focusedDocument: Uri) {
  const workspace = await getWorkspaceFromUri(focusedDocument);

  if (!workspace) {
    return await newFileFromScratch();
  }

  const projectFiles = await getProjectFileUris(workspace);

  // todo: more tests for distance when name of files tarts the same etc
  const projectFile = getNearestProjectFile(projectFiles, focusedDocument);

  if (!projectFile) {
    return await newFileFromWorkspace(workspace);
  }

  const focusedDocumentDirectory = getDirectoryFromFile(focusedDocument);

  return await newFileFromDirectory(projectFile, focusedDocumentDirectory);
}

export async function newFileFromWorkspace(workspace: vscode.WorkspaceFolder, focusedDocument?: Uri | null) {
  const projectFiles = await getProjectFileUris(workspace);

  const projectFile = await selectProject(projectFiles);

  return await newFileFromProject(projectFile, focusedDocument);
}

export async function newFileFromScratch(focusedDocument?: Uri | null) {
  const workspace = await selectWorkspace();

  return await newFileFromWorkspace(workspace, focusedDocument);
}

export async function newFileFromProject(projectFile: Uri, focusedDocument?: Uri | null) {
  const directory = await selectDirectory(projectFile, focusedDocument);

  return await newFileFromDirectory(projectFile, directory);
}

export async function newFileFromDirectory(projectFile: Uri, directory: Uri) {
  const templates = await getTemplates();

  const template = await selectTemplate(templates);

  return await newFileFromTemplate(projectFile, directory, template);
}

export async function newFileFromTemplate(projectFile: Uri, directory: Uri, template: PathItem) {
  const [filename, filePath] = await selectFile(directory, template.label === "Interface");

  extensionChannel.appendLine(`Creating new '${template.label}' in '${filePath}' ...`);

  const namespace = await getNamespace(projectFile, filePath);

  return await newFile(filePath, filename, template.uri, namespace);
}

export async function newFile(filePath: Uri, filename: string, templatePath: Uri, namespace: string) {
  // todo: try doing this differently
  const utfArray = new TextEncoder().encode(namespace);

  await vscode.workspace.fs.writeFile(filePath, utfArray);

  const templateContent = (await getTextFromFile(templatePath)).replace(/\${name}/g, filename);
  const newDocument = await vscode.workspace.openTextDocument(filePath);
  const editor = await vscode.window.showTextDocument(newDocument);
  const snippetString = new vscode.SnippetString(templateContent);

  if (namespace) {
    editor.insertSnippet(snippetString, new vscode.Position(2, 4));
  } else {
    editor.insertSnippet(snippetString);
  }

  extensionChannel.appendLine("Successfully created new file!");
}

// todo: this is badly testable
export async function getNamespace(projectFile: Uri, filepath: Uri) {
  const includeNamespace = getConfiguration<boolean>("includeNamespace", true);

  if (!includeNamespace) {
    return "";
  }

  let namespace: string | null = null;

  const useNamespaceOfNeighboringFiles = getConfiguration<boolean>("useNamespaceOfNeighboringFiles", true);

  // todo: i dont like the nesting here
  if (useNamespaceOfNeighboringFiles) {
    const neighborFile = await getNeighborWithFileExtension(filepath, ".cs");

    if (neighborFile) {
      const neighborNamespace = await getNamespaceFromFile(neighborFile);

      if (neighborNamespace) {
        namespace = neighborNamespace;
      }
    }
  }

  if (!namespace) {
    namespace = await getRootNamespaceFromProject(projectFile);

    if (!namespace) {
      namespace = getProjectName(projectFile);
    }

    if (namespace) {
      const includeSubdirectories = getConfiguration<boolean>("includeSubdirectoriesInNamespace", true);

      if (includeSubdirectories) {
        namespace = appendPathSegementsToProjectName(namespace, projectFile, filepath);
      }
    }
  }

  if (!namespace) {
    extensionChannel.appendLine("[WARN] Namespace of C# Project could not be determined");

    return "";
  }

  return `namespace ${namespace}${EOL}{${EOL}    ${EOL}}`;
}
