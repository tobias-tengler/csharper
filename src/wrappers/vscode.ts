import {
  WorkspaceFolder,
  workspace,
  extensions,
  Extension,
  window,
  QuickPickOptions,
  InputBoxOptions,
  MessageOptions
} from "vscode";

class VSCodeWrapper {
  getWorkspaceFolders(): WorkspaceFolder[] | null {
    const workspaceFolders = workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length < 1) {
      return null;
    }

    return workspaceFolders;
  }

  getExtension(name: string): Extension<any> | null {
    return extensions.getExtension(name) ?? null;
  }

  async showQuickPick(
    items: string[],
    options?: QuickPickOptions
  ): Promise<string | null> {
    return (await window.showQuickPick(items, options)) ?? null;
  }

  async showInputBox(options?: InputBoxOptions): Promise<string | null> {
    return (await window.showInputBox(options)) ?? null;
  }

  displayInfo(text: string, options: MessageOptions = {}) {
    window.showInformationMessage(text, options);
  }

  displayWarning(text: string, options: MessageOptions = {}) {
    window.showWarningMessage(text, options);
  }

  displayError(text: string, options: MessageOptions = {}) {
    window.showErrorMessage(text, options);
  }
}

export default new VSCodeWrapper();
