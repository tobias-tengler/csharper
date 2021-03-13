import { Uri, WorkspaceFolder } from "vscode";
import * as vscode from "vscode";

type WorkspaceResult = [workspace: WorkspaceFolder, origin: Uri | null];

export async function getWorkspace(directoryPath?: string): Promise<WorkspaceResult> {
  if (directoryPath) {
    const directoryPathUri = vscode.Uri.parse(directoryPath);
    const workspaceFromDirectory = vscode.workspace.getWorkspaceFolder(directoryPathUri);

    if (!workspaceFromDirectory) throw new Error("Workspace could not be determined from directory");

    return [workspaceFromDirectory, directoryPathUri];
  } else {
    return await selectWorkspace();
  }
}

async function selectWorkspace(): Promise<WorkspaceResult> {
  const focusedDocument = getFocusedDocument();

  if (focusedDocument) {
    const workspaceFromDocument = vscode.workspace.getWorkspaceFolder(focusedDocument.uri);

    if (workspaceFromDocument) return [workspaceFromDocument, focusedDocument.uri];
  }

  const workspaces = vscode.workspace.workspaceFolders;

  if (!workspaces) throw new Error("Workspaces could not be determined");

  if (workspaces.length === 1) return [workspaces[0], null];

  const selectedWorkspace = await vscode.window.showWorkspaceFolderPick({ ignoreFocusOut: true });

  if (!selectedWorkspace) throw new Error("No workspace could be selected");

  return [selectedWorkspace, null];
}

function getFocusedDocument() {
  const focusedDocument = vscode.window.activeTextEditor?.document;

  if (focusedDocument && !focusedDocument.isUntitled) return focusedDocument;

  return null;
}
