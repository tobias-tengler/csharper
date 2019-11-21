import vscode from "../wrappers/vscode";
import fs from "../wrappers/fs";
import path from "../wrappers/path";
import { DirectoryQuickPickItem } from "../types/DirectoryQuickPickItem";

function getWorkspaceItems(): DirectoryQuickPickItem[] | null {
  const workspaces = vscode.getWorkspaceFolders();

  if (workspaces === null) {
    return null;
  }

  return workspaces.map<DirectoryQuickPickItem>(i => ({
    label: i.name,
    fsPath: i.uri.fsPath
  }));
}

function getDirectoryItems(
  directory: string,
  isRootDir: boolean
): DirectoryQuickPickItem[] {
  let items: DirectoryQuickPickItem[] = [
    {
      label: ".",
      description: "Current directory",
      fsPath: directory
    }
  ];

  if (!isRootDir) {
    items.splice(1, 0, {
      label: "..",
      description: "Parent directory",
      fsPath: path.dirname(directory)
    });
  }

  const diretories = fs
    .getFiles(directory, { withFileTypes: true })
    .filter(i => i.isDirectory())
    .map<DirectoryQuickPickItem>(i => ({
      label: i.name,
      fsPath: directory + path.seperator + i.name
    }));

  if (diretories.length > 0) {
    items = items.concat(diretories);
  }

  return items;
}

export async function selectFileDirectory(): Promise<string | null> {
  let currentWorkspace: DirectoryQuickPickItem | null = null;
  let currentDirectory: string | null = null;

  const workspaces = getWorkspaceItems();

  if (workspaces === null) {
    return null;
  } else if (workspaces.length === 1) {
    currentWorkspace = workspaces[0];
    currentDirectory = currentWorkspace.fsPath;
  }

  while (true) {
    if (currentWorkspace === null) {
      currentWorkspace = await vscode.showQuickPick(workspaces, {
        placeHolder: "Select a workspace",
        ignoreFocusOut: true
      });

      if (currentWorkspace === null) {
        return null;
      }

      currentDirectory = currentWorkspace.fsPath;
    }

    if (currentDirectory === null) {
      return null;
    }

    const inRootDir = currentDirectory === currentWorkspace.fsPath;

    const items = getDirectoryItems(
      currentDirectory,
      inRootDir && workspaces.length === 1
    );

    const selectedItem = await vscode.showQuickPick(items, {
      placeHolder: inRootDir
        ? "Select a directory"
        : currentDirectory.substring(currentWorkspace.fsPath.length),
      ignoreFocusOut: true
    });

    if (selectedItem === null) {
      return null;
    }

    if (selectedItem.label === ".") {
      break;
    }

    if (selectedItem.label === ".." && inRootDir) {
      currentWorkspace = null;
      continue;
    }

    currentDirectory = selectedItem.fsPath;
  }

  return currentDirectory;
}
