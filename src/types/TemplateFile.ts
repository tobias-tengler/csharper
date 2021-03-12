import { QuickPickItem } from "vscode";

export interface TemplateFile extends QuickPickItem {
  filepath: string;
}
