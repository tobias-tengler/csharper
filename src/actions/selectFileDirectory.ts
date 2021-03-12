import vscode from "../wrappers/vscode";
import * as fs from "fs";
import * as path from "path";
import { DirectoryQuickPickItem } from "../types/DirectoryQuickPickItem";

function getWorkspaceItems(): DirectoryQuickPickItem[] | null {
  const workspaces = vscode.getWorkspaceFolders();

  if (workspaces === null) {
    return null;
  }

  return workspaces.map<DirectoryQuickPickItem>((i) => ({
    label: i.name,
    fsPath: i.uri.fsPath,
  }));
}

function getDirectoryItems(directory: string, isRootDir: boolean): DirectoryQuickPickItem[] {
  let items: DirectoryQuickPickItem[] = [
    {
      label: ".",
      description: "Current directory",
      fsPath: directory,
    },
  ];

  if (!isRootDir) {
    items.splice(1, 0, {
      label: "..",
      description: "Parent directory",
      fsPath: path.dirname(directory),
    });
  }

  const diretories = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((file) => file.isDirectory())
    .map<DirectoryQuickPickItem>((file) => ({
      label: file.name,
      fsPath: path.join(directory, file.name),
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
  }

  if (workspaces.length === 1) {
    currentWorkspace = workspaces[0];
    currentDirectory = currentWorkspace.fsPath;
  }

  const focusedDocument = vscode.getFocusedDocument();

  if (focusedDocument !== null) {
    currentDirectory = path.dirname(focusedDocument.uri.fsPath);

    if (workspaces.length > 1) {
      currentWorkspace = workspaces[0];
      let smallest = currentDirectory.replace(currentWorkspace.fsPath, "").length;

      for (let i = 1; i < workspaces.length; i++) {
        const curSmallest = currentDirectory.replace(workspaces[i].fsPath, "").length;

        if (curSmallest < smallest) {
          currentWorkspace = workspaces[i];
          smallest = curSmallest;
        }
      }
    }
  }

  while (true) {
    if (currentWorkspace === null) {
      currentWorkspace = await vscode.showQuickPick(workspaces, {
        placeHolder: "Select a workspace",
        ignoreFocusOut: true,
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

    const items = getDirectoryItems(currentDirectory, inRootDir && workspaces.length === 1);

    const selectedItem = await vscode.showQuickPick(items, {
      placeHolder: inRootDir ? "Select a directory" : currentDirectory.substring(currentWorkspace.fsPath.length),
      ignoreFocusOut: true,
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
