import * as fs from "fs";
import * as path from "path";
import {
  showDocumentFromFile,
  openDocument,
  selectFilename,
  selectTemplate,
  selectDirectory,
  selectCurrentWorkspace,
  getProjectFileUris,
  selectProject,
} from "../vsHelpers";
import { SnippetString, window } from "vscode";
import { getTemplates } from "../templates";
import * as vscode from "vscode";

async function getWorkspace(
  directoryPath: string | null
): Promise<[workspace: vscode.WorkspaceFolder, origin: string | null]> {
  if (directoryPath) {
    const workspaceFromDirectory = vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(directoryPath));

    if (!workspaceFromDirectory) throw new Error("Workspace could not be determined from directory");

    return [workspaceFromDirectory, directoryPath];
  } else {
    return await selectCurrentWorkspace();
  }
}

async function getProjectFile(projectFiles: string[], origin: string | null) {
  if (origin) {
    // todo: determine project file closest to origin
    return "";
  }

  if (projectFiles.length === 1) return projectFiles[0];

  return await selectProject(projectFiles);
}

export default async function newFile(contextMenuPath: string | null): Promise<void> {
  const [targetWorkspace, origin] = await getWorkspace(contextMenuPath);

  const projectFiles = await getProjectFileUris(targetWorkspace);

  const projectFile = await getProjectFile(projectFiles, origin);

  const templates = getTemplates();

  const selectedTemplate = await selectTemplate(templates);

  // console.log(`Creating new '${selectedTemplate.label}' in '${contextMenuPath}' ...`);

  // let filename, filepath;

  // filename = await selectFilename(directoryPath);

  // console.log("Filename:", filename);

  // filepath = path.join(directoryPath, filename + ".cs");

  // const projectFile = getProjectFile();

  // if (projectFile === null) {
  //   window.showWarningMessage("C# Project File could not be determined");
  //   return;
  // }

  // const namespace = getNamespace(projectFile, filepath);

  // if (namespace === null) {
  //   window.showWarningMessage("Namespace of C# Project could not be determined");
  //   return;
  // }

  // const templateDocument = await openDocument(selectedTemplate.path);
  // const templateContent = templateDocument
  //   .getText()
  //   .replace(/\${name}/g, filename)
  //   .replace(/\${namespace}/g, namespace);

  // fs.closeSync(fs.openSync(filepath, "w"));

  // const editor = await showDocumentFromFile(filepath);

  // editor.insertSnippet(new SnippetString(templateContent));

  // console.log("Successfully created file!");
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
