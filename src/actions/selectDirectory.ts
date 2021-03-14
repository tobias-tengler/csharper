import { Disposable, FileType, Uri } from "vscode";
import { PathItem } from "../types/PathItem";
import { EXCLUDED_DIRECTORIES, TITLE, TOTAL_STEPS } from "../constants";
import * as vscode from "vscode";
import * as path from "path";

export async function selectDirectory(editorFileUri: Uri | null, projectUri: Uri) {
  const projectDir = path.dirname(projectUri.fsPath);
  const projectDirUri = Uri.file(projectDir);

  let directories = await getDirectories(projectDirUri);

  if (directories.length < 1 && !editorFileUri) {
    return projectDirUri;
  }

  const directoryItems: PathItem[] = [];

  if (editorFileUri) {
    const editorFileDir = path.dirname(editorFileUri.fsPath);

    if (editorFileDir !== projectDirUri.fsPath) {
      const item = getPathItemFromUri(Uri.file(editorFileDir));
      item.detail = "Directory of currently focused file";

      directoryItems.push(item);

      directories = directories.filter((directory) => directory.fsPath !== editorFileDir);
    }
  }

  directoryItems.push({
    uri: projectDirUri,
    label: path.basename(projectDirUri.fsPath),
    detail: "Project root directory",
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

  const disposables: Disposable[] = [];

  try {
    return await new Promise<Uri>(async (resolve, reject) => {
      const quickpick = vscode.window.createQuickPick<PathItem>();
      quickpick.ignoreFocusOut = true;
      quickpick.canSelectMany = false;
      quickpick.title = TITLE;
      quickpick.placeholder = "Select destination directory";
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

function getPathItemFromUri(uri: Uri): PathItem {
  const directoryName = path.basename(uri.fsPath);

  return { uri, label: directoryName };
}

function addRelativePathDescription(item: PathItem) {
  const relativePath = vscode.workspace.asRelativePath(item.uri, false);

  if (!relativePath.includes(path.sep)) return;

  item.description = relativePath;
}

async function getDirectories(directoryUri: Uri, directories: Uri[] = []) {
  const entries = await vscode.workspace.fs.readDirectory(directoryUri);
  const directoryNames = entries
    .filter(
      ([name, type]) => type === FileType.Directory && EXCLUDED_DIRECTORIES.every((excludedDir) => excludedDir !== name)
    )
    .map((i) => i[0]);

  for (const directoryName of directoryNames) {
    const uri = Uri.joinPath(directoryUri, directoryName);

    directories.push(uri);

    await getDirectories(uri, directories);
  }

  return directories;
}
