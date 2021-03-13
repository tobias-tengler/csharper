import { Disposable } from "vscode";
import { PathItem } from "../types/PathItem";
import { TITLE, TOTAL_STEPS } from "../constants";
import * as vscode from "vscode";

export async function selectTemplate(templates: PathItem[]) {
  const disposables: Disposable[] = [];

  try {
    return await new Promise<PathItem>((resolve, reject) => {
      const quickpick = vscode.window.createQuickPick<PathItem>();
      quickpick.ignoreFocusOut = true;
      quickpick.canSelectMany = false;
      quickpick.title = TITLE;
      quickpick.placeholder = "Select a template";
      quickpick.step = 3;
      quickpick.totalSteps = TOTAL_STEPS;
      quickpick.items = templates;

      disposables.push(
        quickpick.onDidChangeSelection((items) => {
          const selectedItem = items[0];

          if (selectedItem) {
            resolve(selectedItem);
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
