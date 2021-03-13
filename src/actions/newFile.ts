import * as fs from "fs";
import * as path from "path";
import {
  showDocumentFromFile,
  openDocument,
  selectFilename as selectFile,
  selectTemplate,
  selectDirectory,
  selectCurrentWorkspace,
  getProjectFileUris,
  selectProject,
} from "../vsHelpers";
import { getTemplates } from "../templates";
import * as vscode from "vscode";

// todo: settings for no namespace and wether to include subdir in namespace
export default async function newFile(directoryPathFromContextMenu: string | null): Promise<void> {
  try {
    const [targetWorkspace, origin] = await getWorkspace(directoryPathFromContextMenu);

    const projectFiles = await getProjectFileUris(targetWorkspace);

    const projectFile = await getProjectFile(projectFiles, origin);

    let originDirectory = origin;
    if (!directoryPathFromContextMenu) {
      originDirectory = await selectDirectory(origin, projectFile);
    }

    if (!originDirectory) throw new Error("Origin directory could not be determined");

    const templates = getTemplates();

    const template = await selectTemplate(templates);

    const [filename, filepath] = await selectFile(originDirectory);

    console.log(`Creating new '${template.label}' in '${filepath}' ...`);

    const namespace = getNamespace(projectFile.fsPath, filepath);

    if (namespace === null) throw new Error("Namespace of C# Project could not be determined");

    const templateDocument = await openDocument(template.uri.fsPath);
    const templateContent = templateDocument
      .getText()
      .replace(/\${name}/g, filename)
      .replace(/\${namespace}/g, namespace);

    fs.closeSync(fs.openSync(filepath, "w"));

    const editor = await showDocumentFromFile(filepath);

    editor.insertSnippet(new vscode.SnippetString(templateContent));

    console.log("Successfully created file!");
  } catch (error) {
    console.error(error);
  }
}

async function getWorkspace(
  directoryPath: string | null
): Promise<[workspace: vscode.WorkspaceFolder, origin: vscode.Uri | null]> {
  if (directoryPath) {
    const directoryPathUri = vscode.Uri.parse(directoryPath);
    const workspaceFromDirectory = vscode.workspace.getWorkspaceFolder(directoryPathUri);

    if (!workspaceFromDirectory) throw new Error("Workspace could not be determined from directory");

    return [workspaceFromDirectory, directoryPathUri];
  } else {
    return await selectCurrentWorkspace();
  }
}

async function getProjectFile(projectFiles: vscode.Uri[], origin: vscode.Uri | null) {
  if (origin) {
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
  }
  // else if (projectFiles.length === 1) return projectFiles[0];

  return await selectProject(projectFiles);
}

export function getNamespace(projectFile: string, filepath: string): string {
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
