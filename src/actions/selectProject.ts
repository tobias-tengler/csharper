import { Disposable, Uri } from "vscode";
import { PathItem } from "../types/PathItem";
import { TITLE, TOTAL_STEPS } from "../constants";
import * as path from "path";
import * as vscode from "vscode";

export async function selectProject(projectFiles: Uri[]) {
  const projectItems = getProjectPathItems(projectFiles);

  const disposables: Disposable[] = [];

  try {
    return await new Promise<Uri>((resolve, reject) => {
      const quickpick = vscode.window.createQuickPick<PathItem>();
      quickpick.ignoreFocusOut = true;
      quickpick.canSelectMany = false;
      quickpick.title = TITLE;
      quickpick.placeholder = "Select a project";
      quickpick.step = 1;
      quickpick.totalSteps = TOTAL_STEPS;
      quickpick.items = projectItems;

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

export function getProjectPathItems(projectFiles: Uri[]) {
  return projectFiles
  .map((projectFile) => {
    const filename = path.basename(projectFile.fsPath);
    const projectName = filename.replace(".csproj", "");

    const item: PathItem = {
      label: projectName,
      description: vscode.workspace.asRelativePath(projectFile, false),
      uri: projectFile,
    };

    return item;
  })
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}