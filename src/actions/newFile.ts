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
  const configuration = vscode.workspace.getConfiguration("csharper");

  let [workspace, origin] = await getWorkspace(directoryPathFromContextMenu);

  const projectFiles = await getProjectFileUris(workspace);

  let projectFile: Uri | null = null;
  if (origin) {
    const respectFocusedDocument = configuration.get<boolean>("respectFocusedDocument", true);

    if (directoryPathFromContextMenu || respectFocusedDocument) {
      projectFile = getNearestProjectFile(projectFiles, origin);
    } else if (!respectFocusedDocument) {
      origin = null;
    }
  }

  if (!projectFile) {
    projectFile = await selectProject(projectFiles);
  }

  if (!projectFile) throw new Error("Project file could not be determined");

  let destinationDirectory = origin;
  if (!directoryPathFromContextMenu) {
    destinationDirectory = await selectDirectory(origin, projectFile);
  }

  if (!destinationDirectory) throw new Error("Destination directory could not be determined");

  const templates = await getTemplates();

  const template = await selectTemplate(templates);

  const [filename, filepath] = await selectFile(destinationDirectory, template.label === "Interface");

  outputChannel.appendLine(`Creating new '${template.label}' in '${filepath}' ...`);

  const templateDocument = await vscode.workspace.openTextDocument(template.uri);
  const templateContent = templateDocument.getText().replace(/\${name}/g, filename);

  const includeNamespace = configuration.get<boolean>("includeNamespace", true);

  if (includeNamespace) {
    const includeSubdirectoriesInNamespace = configuration.get<boolean>("includeSubdirectoriesInNamespace", true);

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

  await newDocument.save();

  outputChannel.appendLine("Successfully created new file!");
}
