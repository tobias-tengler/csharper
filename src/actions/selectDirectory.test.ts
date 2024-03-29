import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { DIRECTORY_OF_FOCUSED_FILE_LABEL, PROJECT_ROOT_LABEL } from "../constants";
import { PathItem } from "../types/PathItem";
import { getDirectoryItems } from "./selectDirectory";
import { getDirectoryFromFile, getDirectoryName } from "../helpers";

const testWorkspace = vscode.Uri.file(path.resolve(__dirname, "../../test-fixture"));

suite("getDirectoryItems", () => {
  const directories: vscode.Uri[] = [
    vscode.Uri.joinPath(testWorkspace, "Subdir1"),
    vscode.Uri.joinPath(testWorkspace, "Subdir1/SubSubDir1"),
    vscode.Uri.joinPath(testWorkspace, "Subdir2"),
    vscode.Uri.joinPath(testWorkspace, "Subdir2/SubSubDir2"),
  ];
  const directoryPathItems = directories.map<PathItem>((directory) => ({
    label: getDirectoryName(directory),
    uri: directory,
  }));
  const projectDir = testWorkspace;

  const projectDirPathItem: PathItem = {
    label: getDirectoryName(projectDir),
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
    const localDirectories: vscode.Uri[] = [...directories, vscode.Uri.joinPath(projectDir, "Subdir1/SubSubDir2")];

    const items = await getDirectoryItems(projectDir, localDirectories);

    const expectedItems: PathItem[] = [
      projectDirPathItem,
      directoryPathItems[0],
      directoryPathItems[1],
      directoryPathItems[2],
      { ...directoryPathItems[3], description: "Subdir2" },
      {
        label: getDirectoryName(localDirectories[4]),
        uri: localDirectories[4],
        description: "Subdir1",
      },
    ];

    assert.deepStrictEqual(items, expectedItems);
  });

  test("Same directory names (multiple levels)", async () => {
    const localDirectories: vscode.Uri[] = [
      vscode.Uri.joinPath(projectDir, "Subdir1/SubSubDir1/test"),
      vscode.Uri.joinPath(projectDir, "Subdir2/SubSubDir2/test"),
    ];

    const items = await getDirectoryItems(projectDir, localDirectories);

    const expectedItems: PathItem[] = [
      projectDirPathItem,
      {
        label: getDirectoryName(localDirectories[0]),
        uri: localDirectories[0],
        description: "Subdir1/SubSubDir1",
      },
      {
        label: getDirectoryName(localDirectories[1]),
        uri: localDirectories[1],
        description: "Subdir2/SubSubDir2",
      },
    ];

    assert.deepStrictEqual(items, expectedItems);
  });

  test("Focused file has same directory name", async () => {
    const focusedFile = vscode.Uri.joinPath(projectDir, "Subdir1/SubSubDir2/File.cs");
    const localDirectories: vscode.Uri[] = [...directories, vscode.Uri.joinPath(projectDir, "Subdir1/SubSubDir2")];

    const items = await getDirectoryItems(projectDir, localDirectories, focusedFile);

    const expectedItems: PathItem[] = [
      {
        label: getDirectoryName(localDirectories[4]),
        uri: localDirectories[4],
        description: "Subdir1",
        detail: DIRECTORY_OF_FOCUSED_FILE_LABEL,
      },
      projectDirPathItem,
      directoryPathItems[0],
      directoryPathItems[1],
      directoryPathItems[2],
      { ...directoryPathItems[3], description: "Subdir2" },
    ];

    assert.deepStrictEqual(items, expectedItems);
  });

  function getFocusedFileItem(focusedFile: vscode.Uri): PathItem {
    const focusedFileBaseDir = getDirectoryFromFile(focusedFile);

    return {
      label: getDirectoryName(focusedFileBaseDir),
      detail: DIRECTORY_OF_FOCUSED_FILE_LABEL,
      uri: focusedFileBaseDir,
    };
  }
});
