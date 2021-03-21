import * as vscode from "vscode";

export async function getWorkspaceFromUri(uri: vscode.Uri) {
  return vscode.workspace.getWorkspaceFolder(uri);
}

export async function selectWorkspace() {
  const workspaces = vscode.workspace.workspaceFolders;

  if (!workspaces) {
    throw new Error("Workspaces could not be determined");
  }

  if (workspaces.length === 1) {
    return workspaces[0];
  }

  const selectedWorkspace = await vscode.window.showWorkspaceFolderPick({ ignoreFocusOut: true });

  if (!selectedWorkspace) {
    throw new Error("Failed to select workspace");
  }

  return selectedWorkspace;
}
