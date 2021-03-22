import { getDirectoryFromFile, getNeighborWithFileExtension, getTextFromFile } from "../helpers";
import * as vscode from "vscode";
import { selectWorkspace } from "./selectWorkspace";
import { projects } from "../projects";
import { selectProject } from "./selectProject";
import { selectDirectory } from "./selectDirectory";
import { getTemplates } from "../templates";
import { selectTemplate } from "./selectTemplate";
import { selectFile } from "./selectFile";
import { PathItem } from "../types/PathItem";
import { EOL } from "os";
import { extensionChannel } from "../extension";
import { TextEncoder } from "util";
import { configuration } from "../configuration";

class NewFileCommand {
  newFileFromCommand(directoryPathFromContextMenu?: string) {
    if (directoryPathFromContextMenu) {
      return this.newFileFromContextMenu(directoryPathFromContextMenu);
    }

    const focusedDocumentUri = this.getUriOfFocusedDocument();

    if (configuration.respectFocusedDocument() && focusedDocumentUri) {
      return this.newFileFromFocusedDocument(focusedDocumentUri);
    }

    return this.newFileFromScratch(focusedDocumentUri);
  }

  async newFileFromContextMenu(directoryPath: string) {
    const directory = vscode.Uri.file(directoryPath);

    const workspace = await vscode.workspace.getWorkspaceFolder(directory);

    if (!workspace) {
      throw new Error("Workspace could not be determined.");
    }

    const projectFiles = await projects.getProjectFileUris(workspace);

    const projectFile = projects.getNearestProjectFile(projectFiles, directory);

    if (!projectFile) {
      vscode.window.showWarningMessage("C# project file could not be determined");

      throw new Error("Project file could not be determined.");
    }

    return await this.newFileFromDirectory(projectFile, directory);
  }

  async newFileFromFocusedDocument(focusedDocument: vscode.Uri) {
    const workspace = await vscode.workspace.getWorkspaceFolder(focusedDocument);

    if (!workspace) {
      return await this.newFileFromScratch();
    }

    const projectFiles = await projects.getProjectFileUris(workspace);

    const projectFile = projects.getNearestProjectFile(projectFiles, focusedDocument);

    if (!projectFile) {
      return await this.newFileFromWorkspace(workspace, null, projectFiles);
    }

    const focusedDocumentDirectory = getDirectoryFromFile(focusedDocument);

    return await this.newFileFromDirectory(projectFile, focusedDocumentDirectory);
  }

  async newFileFromWorkspace(
    workspace: vscode.WorkspaceFolder,
    focusedDocument?: vscode.Uri | null,
    projectFiles?: vscode.Uri[]
  ) {
    projectFiles = projectFiles ?? (await projects.getProjectFileUris(workspace));

    const projectFile = await selectProject(projectFiles);

    return await this.newFileFromProject(projectFile, focusedDocument);
  }

  async newFileFromScratch(focusedDocument?: vscode.Uri | null) {
    const workspace = await selectWorkspace();

    return await this.newFileFromWorkspace(workspace, focusedDocument);
  }

  async newFileFromProject(projectFile: vscode.Uri, focusedDocument?: vscode.Uri | null) {
    const directory = await selectDirectory(projectFile, focusedDocument);

    return await this.newFileFromDirectory(projectFile, directory);
  }

  async newFileFromDirectory(projectFile: vscode.Uri, directory: vscode.Uri) {
    const templates = await getTemplates();

    const template = await selectTemplate(templates);

    return await this.newFileFromTemplate(projectFile, directory, template);
  }

  async newFileFromTemplate(projectFile: vscode.Uri, directory: vscode.Uri, template: PathItem) {
    const [filename, filePath] = await selectFile(directory, template.label === "Interface");

    extensionChannel.appendLine(`Creating new '${template.label}' in '${filePath}' ...`);

    const namespace = await this.getNamespace(projectFile, filePath);

    return await this.newFile(filePath, filename, template.uri, namespace);
  }

  async newFile(filePath: vscode.Uri, filename: string, templatePath: vscode.Uri, namespace: string) {
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
  async getNamespace(projectFile: vscode.Uri, filepath: vscode.Uri) {
    if (!configuration.includeNamespace()) {
      return "";
    }

    let namespace: string | null = null;

    // todo: i dont like the nesting here
    if (configuration.useNamespaceOfNeighboringFiles()) {
      const neighborFile = await getNeighborWithFileExtension(filepath, ".cs");

      if (neighborFile) {
        const neighborNamespace = await projects.getNamespaceFromFile(neighborFile);

        if (neighborNamespace) {
          namespace = neighborNamespace;
        }
      }
    }

    if (!namespace) {
      namespace = await projects.getRootNamespaceFromProject(projectFile);

      if (!namespace) {
        namespace = projects.getProjectName(projectFile);
      }

      if (namespace) {
        if (configuration.includeSubdirectoriesInNamespace()) {
          namespace = projects.appendPathSegementsToProjectName(namespace, projectFile, filepath);
        }
      }
    }

    if (!namespace) {
      extensionChannel.appendLine("[WARN] Namespace of C# Project could not be determined");

      return "";
    }

    return `namespace ${namespace}${EOL}{${EOL}    ${EOL}}`;
  }

  getUriOfFocusedDocument() {
    const focusedDocument = vscode.window.activeTextEditor?.document;

    if (focusedDocument && !focusedDocument.isUntitled) {
      return focusedDocument.uri;
    }

    return null;
  }
}

export const newFileCommand = new NewFileCommand();
