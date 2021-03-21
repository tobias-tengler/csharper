import { getTemplates } from "../templates";
import { getWorkspace } from "./selectWorkspace";
import { selectFile } from "./selectFile";
import { selectDirectory } from "./selectDirectory";
import { selectTemplate } from "./selectTemplate";
import { selectProject } from "./selectProject";
import {
  appendPathSegementsToProjectName,
  getNamespaceFromFile,
  getNearestProjectFile,
  getProjectFileUris,
  getProjectName,
  getRootNamespaceFromProject,
} from "../projects";
import { OutputChannel, Uri } from "vscode";
import { EOL } from "os";
import { TextEncoder } from "util";
import * as vscode from "vscode";
import { getNeighborWithFileExtension, getTextFromFile } from "../helpers";

// todo: this needs heavy testing
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

  if (!projectFile && !directoryPathFromContextMenu) {
    projectFile = await selectProject(projectFiles);
  }

  if (!projectFile) {
    vscode.window.showWarningMessage("C# project file could not be determined");

    throw new Error("Project file could not be determined");
  }

  let destinationDirectory = origin;
  if (!directoryPathFromContextMenu) {
    destinationDirectory = await selectDirectory(origin, projectFile);
  }

  if (!destinationDirectory) {
    throw new Error("Destination directory could not be determined");
  }

  const templates = await getTemplates();

  const template = await selectTemplate(templates);

  const [filename, fileUri] = await selectFile(destinationDirectory, template.label === "Interface");

  outputChannel.appendLine(`Creating new '${template.label}' in '${fileUri}' ...`);

  const templateContent = (await getTextFromFile(template.uri)).replace(/\${name}/g, filename);

  const includeNamespace = configuration.get<boolean>("includeNamespace", true);

  // todo: i hate this nesting
  if (includeNamespace) {
    let namespace: string | null = null;

    const useNamespaceOfNeighboringFiles = configuration.get<boolean>("useNamespaceOfNeighboringFiles", true);

    if (useNamespaceOfNeighboringFiles) {
      const neighborFile = await getNeighborWithFileExtension(fileUri, ".cs");

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
        const includeSubdirectories = configuration.get<boolean>("includeSubdirectoriesInNamespace", true);

        if (includeSubdirectories) {
          namespace = appendPathSegementsToProjectName(namespace, projectFile, fileUri);
        }
      }
    }

    if (!namespace) {
      throw new Error("Namespace of C# Project could not be determined");
    }

    const namespaceStrig = `namespace ${namespace}${EOL}{${EOL}    ${EOL}}`;

    const utfArray = new TextEncoder().encode(namespaceStrig);

    await vscode.workspace.fs.writeFile(fileUri, utfArray);
  } else {
    await vscode.workspace.fs.writeFile(fileUri, new Uint8Array());
  }

  const newDocument = await vscode.workspace.openTextDocument(fileUri);
  const editor = await vscode.window.showTextDocument(newDocument);
  const snippetString = new vscode.SnippetString(templateContent);

  if (includeNamespace) {
    editor.insertSnippet(snippetString, new vscode.Position(2, 4));
  } else {
    editor.insertSnippet(snippetString);
  }

  outputChannel.appendLine("Successfully created new file!");
}
