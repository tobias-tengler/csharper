import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { DIRECTORY_OF_FOCUSED_FILE_LABEL, PROJECT_ROOT_LABEL } from "../constants";
import { PathItem } from "../types/PathItem";
import { getDirectoryItems } from "./selectDirectory";

suite("getDirectoryItems", () => {
  const directories: vscode.Uri[] = [
    vscode.Uri.file("/home/user/src/Project/Subdir1"),
    vscode.Uri.file("/home/user/src/Project/Subdir1/SubSubDir1"),
    vscode.Uri.file("/home/user/src/Project/Subdir2"),
    vscode.Uri.file("/home/user/src/Project/Subdir2/SubSubDir2"),
  ];
  const directoryPathItems = directories.map<PathItem>((directory) => ({
    label: path.basename(directory.fsPath),
    uri: directory,
  }));
  const projectDir = vscode.Uri.file("/home/user/src/Project");

  const projectDirPathItem: PathItem = {
    label: path.basename(projectDir.fsPath),
    detail: PROJECT_ROOT_LABEL,
    uri: projectDir,
  };

  test("Base case", async () => {
    const items = await getDirectoryItems(projectDir, directories);

    const expectedItems: PathItem[] = [projectDirPathItem, ...directoryPathItems];

    assert.deepStrictEqual(items, expectedItems);
  });

  test("Focused file", async () => {
    const focusedFile = vscode.Uri.joinPath(directories[3], "File.cs");
    const items = await getDirectoryItems(projectDir, directories, focusedFile);

    const expectedItems: PathItem[] = [
      getFocusedFileItem(focusedFile),
      projectDirPathItem,
      directoryPathItems[0],
      directoryPathItems[1],
      directoryPathItems[2],
    ];

    assert.deepStrictEqual(items, expectedItems);
  });

  test("Focused file is in project root", async () => {
    const focusedFile = vscode.Uri.joinPath(projectDir, "File.cs");
    const items = await getDirectoryItems(projectDir, directories, focusedFile);

    const expectedItems: PathItem[] = [projectDirPathItem, ...directoryPathItems];

    assert.deepStrictEqual(items, expectedItems);
  });

  test("Focused file is outside of project root", async () => {
    const focusedFile = vscode.Uri.file("/opt/test/File.cs");
    const items = await getDirectoryItems(projectDir, directories, focusedFile);

    const expectedItems: PathItem[] = [projectDirPathItem, ...directoryPathItems];

    assert.deepStrictEqual(items, expectedItems);
  });

  test("No directories", async () => {
    const items = await getDirectoryItems(projectDir, []);

    const expectedItems: PathItem[] = [projectDirPathItem];

    assert.deepStrictEqual(items, expectedItems);
  });

  test("Same directory names", async () => {
    const localDirectories: vscode.Uri[] = [
      ...directories,
      vscode.Uri.file("/home/user/src/Project/Subdir1/SubSubDir2"),
    ];

    // todo: how to mock vscode.workspace.asRelativePath
    const items = await getDirectoryItems(projectDir, localDirectories);

    const expectedItems: PathItem[] = [
      projectDirPathItem,
      directoryPathItems[0],
      directoryPathItems[1],
      directoryPathItems[2],
      { ...directoryPathItems[3], description: "home/user/src/Project/Subdir2" },
      {
        label: path.basename(localDirectories[4].fsPath),
        uri: localDirectories[4],
        description: "home/user/src/Project/Subdir1",
      },
    ];

    assert.deepStrictEqual(items, expectedItems);
  });

  test("Focused file has same directory name", async () => {
    const focusedFile = vscode.Uri.file("/home/user/src/Project/Subdir1/SubSubDir2/File.cs");
    const localDirectories: vscode.Uri[] = [
      ...directories,
      vscode.Uri.file("/home/user/src/Project/Subdir1/SubSubDir2"),
    ];

    // todo: how to mock vscode.workspace.asRelativePath
    const items = await getDirectoryItems(projectDir, localDirectories, focusedFile);

    const expectedItems: PathItem[] = [
      {
        label: path.basename(localDirectories[4].fsPath),
        uri: localDirectories[4],
        description: "home/user/src/Project/Subdir1",
        detail: DIRECTORY_OF_FOCUSED_FILE_LABEL,
      },
      projectDirPathItem,
      directoryPathItems[0],
      directoryPathItems[1],
      directoryPathItems[2],
      { ...directoryPathItems[3], description: "home/user/src/Project/Subdir2" },
    ];

    assert.deepStrictEqual(items, expectedItems);
  });

  function getFocusedFileItem(focusedFile: vscode.Uri): PathItem {
    const focusedFileBaseDir = vscode.Uri.file(path.dirname(focusedFile.fsPath));

    return {
      label: path.basename(focusedFileBaseDir.fsPath),
      detail: DIRECTORY_OF_FOCUSED_FILE_LABEL,
      uri: focusedFileBaseDir,
    };
  }
});
