import * as assert from "assert";
import * as vscode from "vscode";
import { getNearestProjectFile } from "./projects";

suite("getNearestProjectFile", () => {
  test("No project files", () => {
    const projectFiles: vscode.Uri[] = [];
    const origin = vscode.Uri.file("/src/dir/example.cs");

    const result = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(result, null);
  });

  test("Origin in same folder", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir/example.cs");

    const result = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(result?.fsPath, projectFile.fsPath);
  });

  test("Origin on same folder", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir");

    const result = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(result?.fsPath, projectFile.fsPath);
  });

  test("Origin below project file", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir/subdir/example.cs");

    const result = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(result?.fsPath, projectFile.fsPath);
  });

  test("Origin two below project file", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir/subdir/subdir2/example.cs");

    const result = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(result?.fsPath, projectFile.fsPath);
  });

  test("Origin above project file", () => {
    const projectFile = vscode.Uri.file("/src/dir/subdir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir/example.cs");

    const result = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(result, null);
  });

  test("Origin in different folder", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/subdir/example.cs");

    const result = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(result, null);
  });

  test("Origin on different folder", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/subdir");

    const result = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(result, null);
  });
});
