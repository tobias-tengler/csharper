import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { DIRECTORY_OF_FOCUSED_FILE_LABEL, EXCLUDED_DIRECTORIES, PROJECT_ROOT_LABEL } from "../constants";
import { PathItem } from "../types/PathItem";
import { getDirectoryItems } from "./selectDirectory";

suite("getDirectoryItems", () => {
  const directories: vscode.Uri[] = [
    vscode.Uri.file("/home/user/src/Project/Subdir1"),
    vscode.Uri.file("/home/user/src/Project/Subdir1/Subdir12"),
    vscode.Uri.file("/home/user/src/Project/Subdir2"),
    vscode.Uri.file("/home/user/src/Project/Subdir2/Subdir21"),
    vscode.Uri.file("/home/user/src/Project/Subdir2/Subdir21/Subdir211"),
  ];
  const projectDir = vscode.Uri.file("/home/user/src/Project");

  test("Base case", async () => {
    const items = await getDirectoryItems(projectDir, directories);

    assert.strictEqual(items.length, directories.length + 1);
    isProjectDirItem(projectDir, items[0]);
    isEveryDirectoryPresent(directories, items);
  });

  test("Focused file", async () => {
    const focusedFile = vscode.Uri.joinPath(directories[3], "File.cs");
    const items = await getDirectoryItems(projectDir, directories, focusedFile);

    assert.strictEqual(items.length, directories.length + 1);
    isFocusedFileDirItem(focusedFile, items[0]);
    isProjectDirItem(projectDir, items[1]);
    isEveryDirectoryPresent(directories, items);
  });

  test("Exclude excluded directory names", async () => {
    const excludedDirectories = EXCLUDED_DIRECTORIES.map((excludedDir) => vscode.Uri.joinPath(projectDir, excludedDir));
    const localDirectories = [...directories, ...excludedDirectories];

    const items = await getDirectoryItems(projectDir, localDirectories, null, EXCLUDED_DIRECTORIES);

    assert.strictEqual(items.length, directories.length + 1);
    isProjectDirItem(projectDir, items[0]);
    isEveryDirectoryPresent([...directories, projectDir], items);

    for (const excludedDirectory of excludedDirectories) {
      if (items.some((item) => item.uri.fsPath === excludedDirectory.fsPath)) {
        assert.fail(`Excluded directory "${excludedDirectory.fsPath}" was present in items.`);
      }
    }
  });

  test("Focused file is in project root", async () => {
    const focusedFile = vscode.Uri.joinPath(projectDir, "File.cs");
    const items = await getDirectoryItems(projectDir, directories, focusedFile);

    assert.strictEqual(items.length, directories.length + 1);
    isProjectDirItem(projectDir, items[0]);
    isEveryDirectoryPresent(directories, items);
  });

  test("Focused file is outside of project root", async () => {
    const focusedFile = vscode.Uri.file("/opt/test/File.cs");
    const items = await getDirectoryItems(projectDir, directories, focusedFile);

    assert.strictEqual(items.length, directories.length + 1);
    isProjectDirItem(projectDir, items[0]);
    isEveryDirectoryPresent(directories, items);
  });

  test("No directories", async () => {
    const items = await getDirectoryItems(projectDir, []);

    assert.strictEqual(items.length, 1);
    isProjectDirItem(projectDir, items[0]);
  });

  function isEveryDirectoryPresent(dirs: vscode.Uri[], items: PathItem[]) {
    for (const dir of dirs) {
      if (!items.find((item) => item.uri.fsPath === dir.fsPath)) {
        assert.fail(`Directory "${dir}" is not present in items.`);
      }
    }
  }

  function isProjectDirItem(projectDir: vscode.Uri, item: PathItem) {
    assert.strictEqual(item.uri.fsPath, projectDir.fsPath);
    assert.strictEqual(item.detail, PROJECT_ROOT_LABEL);
  }

  function isFocusedFileDirItem(focusedFile: vscode.Uri, item: PathItem) {
    const focusedFileDir = path.dirname(focusedFile.fsPath);

    assert.strictEqual(item.uri.fsPath, focusedFileDir);
    assert.strictEqual(item.detail, DIRECTORY_OF_FOCUSED_FILE_LABEL);
  }
});
