import { Disposable, FileType, Uri } from "vscode";
import { PathItem } from "../types/PathItem";
import {
  DIRECTORY_OF_FOCUSED_FILE_LABEL,
  EXCLUDED_DIRECTORIES,
  PROJECT_ROOT_LABEL,
  TITLE,
  TOTAL_STEPS,
} from "../constants";
import * as vscode from "vscode";
import * as path from "path";
import { getDirectoryFromFile, getDirectoryName, isFileChildOfDirectory } from "../helpers";

export async function selectDirectory(projectFile: Uri, focusedDocument?: Uri | null) {
  const projectDirUri = getDirectoryFromFile(projectFile);

  const directories = await getDirectories(projectDirUri, EXCLUDED_DIRECTORIES);

  const directoryItems = await getDirectoryItems(projectDirUri, directories, focusedDocument);

  if (directoryItems.length <= 1 && !focusedDocument) {
    return projectDirUri;
  }

  const disposables: Disposable[] = [];

  try {
    return await new Promise<Uri>(async (resolve, reject) => {
      const quickpick = vscode.window.createQuickPick<PathItem>();
      quickpick.ignoreFocusOut = true;
      quickpick.canSelectMany = false;
      quickpick.title = TITLE;
      quickpick.placeholder = "Select a destination directory";
      quickpick.step = 2;
      quickpick.totalSteps = TOTAL_STEPS;
      quickpick.items = directoryItems;

      disposables.push(
        quickpick.onDidChangeSelection((items) => {
          const selectedItem = items[0];

          if (selectedItem) {
            resolve(selectedItem.uri);
            quickpick.hide();
          }
        })
      );

      disposables.push(
        quickpick.onDidHide(() => {
          reject();
          quickpick.dispose();
        })
      );

      quickpick.show();
    });
  } finally {
    disposables.map((disposable) => disposable.dispose());
  }
}

export async function getDirectoryItems(projectDir: Uri, directories: Uri[], editorFile?: Uri | null) {
  const directoryItems: PathItem[] = [];

  if (editorFile) {
    if (isFileChildOfDirectory(projectDir, editorFile)[0]) {
      const editorFileDir = getDirectoryFromFile(editorFile);

      const item = getPathItemFromUri(editorFileDir);
      item.detail = DIRECTORY_OF_FOCUSED_FILE_LABEL;

      directoryItems.push(item);

      directories = directories.filter((directory) => directory.fsPath !== editorFileDir.fsPath);
    }
  }

  directoryItems.push({
    ...getPathItemFromUri(projectDir),
    detail: PROJECT_ROOT_LABEL,
  });

  for (const directory of directories) {
    const item = getPathItemFromUri(directory);

    const itemWithSameLabel = directoryItems.find((i) => i.label === item.label);

    if (itemWithSameLabel) {
      if (!itemWithSameLabel.description) {
        addRelativePathDescription(itemWithSameLabel);
      }

      addRelativePathDescription(item);
    }

    directoryItems.push(item);
  }

  return directoryItems;
}

function getPathItemFromUri(uri: Uri): PathItem {
  return { uri, label: getDirectoryName(uri) };
}

function addRelativePathDescription(item: PathItem) {
  const relativePath = vscode.workspace.asRelativePath(item.uri, false);
  const pathSegments = relativePath.split("/");

  if (pathSegments.length === 1) {
    item.description = relativePath;
  } else {
    item.description = pathSegments.slice(0, pathSegments.length - 1).join("/");
  }
}

async function getDirectories(directoryUri: Uri, excludedNames: string[], directories: Uri[] = []) {
  const entries = await vscode.workspace.fs.readDirectory(directoryUri);
  const directoryNames = entries
    .filter(([name, type]) => type === FileType.Directory && !excludedNames.some((i) => i === name))
    .map((i) => i[0]);

  for (const directoryName of directoryNames) {
    const uri = Uri.joinPath(directoryUri, directoryName);

    directories.push(uri);

    await getDirectories(uri, excludedNames, directories);
  }

  return directories;
}
