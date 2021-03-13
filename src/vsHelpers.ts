import { TextDocument, TextEditor, Uri, window, workspace, Disposable, FileType, RelativePattern } from "vscode";
import { PathItem } from "./types/PathItem";
import * as path from "path";
import { existsSync, readdirSync } from "fs";
import { WorkspaceFolder } from "vscode";

const TOTAL_STEPS = 4;
const TITLE = "New C# File";

function getFocusedDocument() {
  const focusedDocument = window.activeTextEditor?.document;

  if (focusedDocument && !focusedDocument.isUntitled) return focusedDocument;

  return null;
}

export async function selectCurrentWorkspace(): Promise<[workspace: WorkspaceFolder, origin: string | null]> {
  const focusedDocument = getFocusedDocument();

  if (focusedDocument) {
    const workspaceFromDocument = workspace.getWorkspaceFolder(focusedDocument.uri);

    if (workspaceFromDocument) return [workspaceFromDocument, focusedDocument.uri.fsPath];
  }

  const workspaces = workspace.workspaceFolders;

  if (!workspaces) throw new Error("Workspaces could not be determined");

  if (workspaces.length === 1) return [workspaces[0], null];

  const selectedWorkspace = await window.showWorkspaceFolderPick({ ignoreFocusOut: true });

  if (!selectedWorkspace) throw new Error("Selected workspace could not be determined");

  return [selectedWorkspace, null];
}

export async function selectProject(uris: string[]) {
  // todo: implement
  return "";
}

export async function getProjectFileUris(workspaceFolder: WorkspaceFolder) {
  const relativePattern = new RelativePattern(workspaceFolder, "**/*.csproj");

  const uris = await workspace.findFiles(relativePattern);

  if (!uris || uris.length < 1) throw new Error("No C# projects could be found in the selected workspace");

  return uris.map((i) => i.fsPath);
}

async function getDirectories(workspaceFolder: WorkspaceFolder, directories: string[] = []) {
  const foldersToExcludeMap = workspace
    .getConfiguration("files", workspaceFolder)
    .get<{ [key: string]: boolean }>("exclude");

  if (foldersToExcludeMap) {
    const wuw = Object.entries(foldersToExcludeMap)
      .filter((i) => i[1] === true)
      .map((i) => i[0]);
  }

  return [""];

  // const directoryEntries = await workspace.fs.readDirectory(Uri.parse(directoryPath));
  // const subDirs = directoryEntries.filter((i) => i[1] === FileType.Directory).map((i) => i[0]);

  // console.log(directoryPath, subDirs);

  // for (const [subDir] of subDirs) {
  //   const fullpath = path.join(directoryPath, subDir);

  //   directories.push(fullpath);

  //   await getDirectories(fullpath, directories);
  // }

  // return directories;
}

function getPathItemFromPath(input: string, baseDir: string): PathItem {
  return {
    path: input,
    label: path.basename(input),
    description: input.replace(baseDir, ""),
  };
}

export async function selectDirectory() {
  const disposables: Disposable[] = [];

  try {
    return await new Promise<string>(async (resolve, reject) => {
      // const currentWorkspace = await selectCurrentWorkspace();
      // const projectFileUris = await getProjectFileUris(currentWorkspace);
      // console.log({ projectFileUris });
      // const quickpick = window.createQuickPick<PathItem>();
      // quickpick.ignoreFocusOut = true;
      // quickpick.canSelectMany = false;
      // quickpick.title = TITLE;
      // quickpick.placeholder = `Search for directory in workspace '${currentWorkspace.name}'`;
      // quickpick.step = 1;
      // quickpick.totalSteps = TOTAL_STEPS;
      // todo: this could maybe be lazy
      // const directories = await getDirectories(currentWorkspace);
      // const directoryItems = directories.map((directory) =>
      //   getPathItemFromPath(directory, currentWorkspace.uri.fsPath)
      // );
      // console.log("directories", directories);
      // const focusedDocument = getFocusedDocument();
      // if (focusedDocument) {
      //   const focusedDocumentDir = path.dirname(focusedDocument.uri.fsPath);
      //   const item = getPathItemFromPath(focusedDocumentDir, "");
      //   item.description = "Directory of focused document";
      //   item.alwaysShow = true;
      //   item.picked = true;
      //   quickpick.items = [item, ...directoryItems];
      // } else {
      //   quickpick.items = directoryItems;
      // }
      // disposables.push(
      //   quickpick.onDidHide(() => {
      //     reject();
      //     quickpick.dispose();
      //   })
      // );
      // quickpick.show();
    });
  } finally {
    disposables.map((disposable) => disposable.dispose());
  }
}

export async function selectTemplate(templates: PathItem[]) {
  const disposables: Disposable[] = [];

  try {
    return await new Promise<PathItem>((resolve, reject) => {
      const quickpick = window.createQuickPick<PathItem>();
      quickpick.ignoreFocusOut = true;
      quickpick.canSelectMany = false;
      quickpick.title = TITLE;
      quickpick.step = 3;
      quickpick.totalSteps = TOTAL_STEPS;
      quickpick.items = templates;

      disposables.push(
        quickpick.onDidChangeSelection((items) => {
          const firstItem = items[0];

          if (firstItem) {
            resolve(firstItem);
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

export async function selectFilename(directoryPath: string) {
  const disposables: Disposable[] = [];

  try {
    return await new Promise<string>((resolve, reject) => {
      let selectedFileName: string;
      let error: boolean;

      const input = window.createInputBox();
      input.ignoreFocusOut = true;
      input.prompt = "Please enter a name for your file";
      input.title = TITLE;
      input.step = 4;
      input.totalSteps = TOTAL_STEPS;

      disposables.push(
        input.onDidChangeValue((value) => {
          if (value) {
            if (!/^[a-zA-Z0-9_]+$/.test(value)) {
              input.validationMessage = "Name contains invalid characters";
              error = true;

              return;
            }

            const filepath = path.join(directoryPath, value + ".cs");

            if (existsSync(filepath)) {
              input.validationMessage = "File already exists";
              error = true;

              return;
            }
          }

          selectedFileName = value;
          input.validationMessage = undefined;
          error = false;
        })
      );

      disposables.push(
        input.onDidAccept(() => {
          if (!selectedFileName || error) return;

          resolve(selectedFileName);
          input.hide();
        })
      );

      disposables.push(
        input.onDidHide(() => {
          reject();
          input.dispose();
        })
      );

      input.show();
    });
  } finally {
    disposables.map((disposable) => disposable.dispose());
  }
}

export async function openDocument(filepath: string): Promise<TextDocument> {
  return await workspace.openTextDocument(filepath);
}

export async function showDocument(document: TextDocument) {
  await window.showTextDocument(document);
}

export async function showDocumentFromFile(filePath: string): Promise<TextEditor> {
  const document = await openDocument(filePath);

  return await window.showTextDocument(document);
}
