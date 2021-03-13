import { getTemplates } from "../templates";
import { getWorkspace } from "./selectWorkspace";
import { selectFile } from "./selectFile";
import { selectDirectory } from "./selectDirectory";
import { selectTemplate } from "./selectTemplate";
import { selectProject } from "./selectProject";
import { getNearestProjectFile, getProjectFileUris, getProjectNamespace } from "../projects";
import { OutputChannel, Uri } from "vscode";
import { EOL } from "os";
import { TextEncoder } from "util";
import * as vscode from "vscode";

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

  const templateDocument = await vscode.workspace.openTextDocument(template.uri);
  const templateContent = templateDocument.getText().replace(/\${name}/g, filename);

  const includeNamespace = vscode.workspace.getConfiguration("csharper").get<boolean>("includeNamespace", true);

  if (includeNamespace) {
    const includeSubdirectoriesInNamespace = vscode.workspace
      .getConfiguration("csharper")
      .get<boolean>("includeSubdirectoriesInNamespace", false);

    const namespace = getProjectNamespace(projectFile.fsPath, filepath.fsPath, includeSubdirectoriesInNamespace);

    if (namespace === null) throw new Error("Namespace of C# Project could not be determined");

    const namespaceStrig = `namespace ${namespace}${EOL}{${EOL}    ${EOL}}`;

    const utfArray = new TextEncoder().encode(namespaceStrig);

    await vscode.workspace.fs.writeFile(filepath, utfArray);
  } else {
    await vscode.workspace.fs.writeFile(filepath, new Uint8Array());
  }

  const newDocument = await vscode.workspace.openTextDocument(filepath);
  const editor = await vscode.window.showTextDocument(newDocument);
  const snippetString = new vscode.SnippetString(templateContent);

  if (includeNamespace) {
    editor.insertSnippet(snippetString, new vscode.Position(2, 4));
  } else {
    editor.insertSnippet(snippetString);
  }

  outputChannel.appendLine("Successfully created new file!");
}
