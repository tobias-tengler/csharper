import { getTemplates } from "../templates";
import { getWorkspace } from "./selectWorkspace";
import { selectFile } from "./selectFile";
import { selectDirectory } from "./selectDirectory";
import { selectTemplate } from "./selectTemplate";
import { selectProject } from "./selectProject";
import { getNearestProjectFile, getProjectFileUris, getProjectNamespace } from "../projects";
import { OutputChannel, Uri } from "vscode";
import * as vscode from "vscode";

// todo: settings for no namespace and wether to include subdir in namespace
export async function newFile(outputChannel: OutputChannel, directoryPathFromContextMenu?: string) {
  const [targetWorkspace, origin] = await getWorkspace(directoryPathFromContextMenu);

  const projectFiles = await getProjectFileUris(targetWorkspace);

  let projectFile: Uri | null = null;
  if (origin) {
    projectFile = getNearestProjectFile(projectFiles, origin);
  }

  if (!projectFile) {
    projectFile = await selectProject(projectFiles);
  }

  if (!projectFile) throw new Error("Project file could not be determined");

  let originDirectory = origin;
  if (!directoryPathFromContextMenu) {
    originDirectory = await selectDirectory(origin, projectFile);
  }

  if (!originDirectory) throw new Error("Origin directory could not be determined");

  const templates = await getTemplates();

  const template = await selectTemplate(templates);

  const [filename, filepath] = await selectFile(originDirectory, template.label === "Interface");

  outputChannel.appendLine(`Creating new '${template.label}' in '${filepath}' ...`);

  const namespace = getProjectNamespace(projectFile.fsPath, filepath.fsPath);

  if (namespace === null) throw new Error("Namespace of C# Project could not be determined");

  const templateDocument = await vscode.workspace.openTextDocument(template.uri);
  const templateContent = templateDocument
    .getText()
    .replace(/\${name}/g, filename)
    .replace(/\${namespace}/g, namespace);

  await vscode.workspace.fs.writeFile(filepath, new Uint8Array());

  const newDocument = await vscode.workspace.openTextDocument(filepath);
  const editor = await vscode.window.showTextDocument(newDocument);

  editor.insertSnippet(new vscode.SnippetString(templateContent));

  outputChannel.appendLine("Successfully created new file!");
}
