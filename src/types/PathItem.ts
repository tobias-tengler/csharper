import { QuickPickItem, Uri } from "vscode";

export interface PathItem extends QuickPickItem {
  uri: Uri;
}
