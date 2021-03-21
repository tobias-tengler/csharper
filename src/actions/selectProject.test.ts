import * as vscode from "vscode";
import * as path from "path";
import { getProjectPathItems } from "./selectProject";
import * as assert from "assert";
import { PathItem } from "../types/PathItem";

const testWorkspace = vscode.Uri.file(path.resolve(__dirname, "../../test-fixture"));

suite("getProjectPathItems", () => {
  test("Base case", () => {
    const projectFiles = [
      vscode.Uri.joinPath(testWorkspace, "subdir1/Example1.csproj"),
      vscode.Uri.joinPath(testWorkspace, "subdir2/Example2.csproj"),
    ];

    const items = getProjectPathItems(projectFiles);

    const expectedItems: PathItem[] = [
      {
        label: "Example1",
        description: "subdir1/Example1.csproj",
        uri: projectFiles[0],
      },
      {
        label: "Example2",
        description: "subdir2/Example2.csproj",
        uri: projectFiles[1],
      },
    ];

    assert.deepStrictEqual(items, expectedItems);
  });

  test("Projects are sorted", () => {
    const projectFiles = [
      vscode.Uri.joinPath(testWorkspace, "subdir1/A3.csproj"),
      vscode.Uri.joinPath(testWorkspace, "subdir2/BC2.csproj"),
      vscode.Uri.joinPath(testWorkspace, "subdir2/A1.csproj"),
    ];

    const items = getProjectPathItems(projectFiles);

    const expectedItems: PathItem[] = [
      {
        label: "A1",
        description: "subdir2/A1.csproj",
        uri: projectFiles[2],
      },
      {
        label: "A3",
        description: "subdir1/A3.csproj",
        uri: projectFiles[0],
      },
      {
        label: "BC2",
        description: "subdir2/BC2.csproj",
        uri: projectFiles[1],
      },
    ];

    assert.deepStrictEqual(items, expectedItems);
  });

  test("Project names are sanitized", () => {
    const projectFiles = [vscode.Uri.joinPath(testWorkspace, "Test1-Test2@Test3.Test4.csproj")];

    const items = getProjectPathItems(projectFiles);

    const expectedItems: PathItem[] = [
      {
        label: "Test1Test2Test3.Test4",
        description: "Test1-Test2@Test3.Test4.csproj",
        uri: projectFiles[0],
      },
    ];

    assert.deepStrictEqual(items, expectedItems);
  });
});
