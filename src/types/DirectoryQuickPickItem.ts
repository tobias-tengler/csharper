import { QuickPickItem } from "vscode";

export interface DirectoryQuickPickItem extends QuickPickItem {
  fsPath: string;
}
