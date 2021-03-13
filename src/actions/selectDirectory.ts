import { Disposable, FileType, Uri } from "vscode";
import { PathItem } from "../types/PathItem";
import { EXCLUDED_DIRECTORIES, TITLE, TOTAL_STEPS } from "../constants";
import * as vscode from "vscode";
import * as path from "path";

export async function selectDirectory(editorFileUri: Uri | null, projectUri: Uri) {
  const projectDir = path.dirname(projectUri.fsPath);
  const projectDirUri = Uri.parse(projectDir);

  const directories = await getDirectories(projectDirUri);

  if (directories.length < 1 && !editorFileUri) {
    return projectDirUri;
  }

  const directoryItems: PathItem[] = [];

  if (editorFileUri) {
    const editorFileDir = path.dirname(editorFileUri.fsPath);

    const item = getPathItemFromUri(Uri.parse(editorFileDir));
    item.detail = "Directory of currently focused file";

    // todo: directory is added twice
    directoryItems.push(item);
  }

  directoryItems.push({
    uri: projectDirUri,
    label: path.basename(projectDirUri.fsPath),
    detail: "Project root directory",
  });

  // todo: only show description if directoryName exists twice
  directoryItems.push(...directories.map<PathItem>(getPathItemFromUri));

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
  const relativePath = vscode.workspace.asRelativePath(uri, false);

  return { uri, label: directoryName, description: relativePath };
}

async function getDirectories(directoryUri: Uri, directories: Uri[] = []) {
  const entries = await vscode.workspace.fs.readDirectory(directoryUri);
  const directoryNames = entries
    .filter(
      ([name, type]) => type === FileType.Directory && EXCLUDED_DIRECTORIES.every((excludedDir) => excludedDir !== name)
    )
    .map((i) => i[0]);

  for (const directoryName of directoryNames) {
    const fullpath = path.join(directoryUri.fsPath, directoryName);
    const uri = Uri.parse(fullpath);

    directories.push(uri);

    await getDirectories(uri, directories);
  }

  return directories;
}
