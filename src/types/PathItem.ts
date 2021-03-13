import { QuickPickItem } from "vscode";

export interface PathItem extends QuickPickItem {
  path: string;
}
