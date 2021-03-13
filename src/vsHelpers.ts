import { TextDocument, TextEditor, Uri, window, workspace, Disposable, FileType, RelativePattern } from "vscode";
import { PathItem } from "./types/PathItem";
import * as path from "path";
import { existsSync } from "fs";
import { WorkspaceFolder } from "vscode";

const TOTAL_STEPS = 4;
const TITLE = "New C# File";
const EXCLUDED_DIRECTORIES = ["bin", "obj", "Properties", ".vscode"];

export async function selectCurrentWorkspace(): Promise<[workspace: WorkspaceFolder, origin: Uri | null]> {
  const focusedDocument = getFocusedDocument();

  if (focusedDocument) {
    const workspaceFromDocument = workspace.getWorkspaceFolder(focusedDocument.uri);

    if (workspaceFromDocument) return [workspaceFromDocument, focusedDocument.uri];
  }

  const workspaces = workspace.workspaceFolders;

  if (!workspaces) throw new Error("Workspaces could not be determined");

  if (workspaces.length === 1) return [workspaces[0], null];

  const selectedWorkspace = await window.showWorkspaceFolderPick({ ignoreFocusOut: true });

  if (!selectedWorkspace) throw new Error("Selected workspace could not be determined");

  return [selectedWorkspace, null];
}

export async function selectProject(projectFiles: Uri[]): Promise<Uri> {
  const projectItems = projectFiles
    .map((projectFile) => {
      const filename = path.basename(projectFile.fsPath);
      const projectName = filename.replace(".csproj", "");

      const item: PathItem = {
        label: projectName,
        description: workspace.asRelativePath(projectFile, false),
        uri: projectFile,
      };

      return item;
    })
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

  // todo: with title and steps
  const selectedProject = await window.showQuickPick(projectItems);

  if (!selectedProject) throw new Error("No project was selected");

  return selectedProject.uri;
}

export async function selectDirectory(editorFileUri: Uri | null, projectUri: Uri) {
  const disposables: Disposable[] = [];

  try {
    return await new Promise<Uri>(async (resolve, reject) => {
      const projectDir = path.dirname(projectUri.fsPath);
      const projectDirUri = Uri.parse(projectDir);

      const directories = await getDirectories(projectDirUri);

      // todo: take editorFileUri into account
      const directoryItems: PathItem[] = [
        {
          uri: projectDirUri,
          label: path.basename(projectDirUri.fsPath),
          description: "Project root directory",
        },
        ...directories.map<PathItem>((directory) => {
          const directoryName = path.basename(directory.fsPath);
          const relativePath = workspace.asRelativePath(directory, false);

          // todo: only show description if directoryName exists twice
          return { uri: directory, label: directoryName, description: relativePath };
        }),
      ];

      if (directoryItems.length === 1) {
        resolve(directoryItems[0].uri);
        return;
      }

      const quickpick = window.createQuickPick<PathItem>();
      quickpick.ignoreFocusOut = true;
      quickpick.canSelectMany = false;
      quickpick.title = TITLE;
      quickpick.placeholder = "Select directory where you would like to place the file";
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

export async function selectFilename(directory: Uri) {
  const disposables: Disposable[] = [];

  try {
    return await new Promise<[filename: string, filepath: string]>((resolve, reject) => {
      let selectedFilename: string;
      let selectedFilepath: string;
      let error: boolean;

      const input = window.createInputBox();
      input.ignoreFocusOut = true;
      input.prompt = "Please enter a name for the file";
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

            selectedFilepath = path.join(directory.fsPath, value + ".cs");

            if (existsSync(selectedFilepath)) {
              input.validationMessage = "File already exists";
              error = true;

              return;
            }
          }

          selectedFilename = value;
          input.validationMessage = undefined;
          error = false;
        })
      );

      disposables.push(
        input.onDidAccept(() => {
          if (!selectedFilename || error) return;

          resolve([selectedFilename, selectedFilepath]);
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

function getFocusedDocument() {
  const focusedDocument = window.activeTextEditor?.document;

  if (focusedDocument && !focusedDocument.isUntitled) return focusedDocument;

  return null;
}

export async function getProjectFileUris(workspaceFolder: WorkspaceFolder) {
  const relativePattern = new RelativePattern(workspaceFolder, "**/*.csproj");

  const uris = await workspace.findFiles(relativePattern);

  if (!uris || uris.length < 1) throw new Error("No C# projects could be found in the selected workspace");

  return uris;
}

async function getDirectories(directoryUri: Uri, directories: Uri[] = []) {
  const entries = await workspace.fs.readDirectory(directoryUri);
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
