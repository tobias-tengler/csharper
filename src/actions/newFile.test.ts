import * as sinon from "sinon";
import { newFileCommand } from "./newFile";
import { describe, afterEach, it } from "mocha";
import { configuration } from "../configuration";
import * as vscode from "vscode";
import * as assert from "assert";
import { projects } from "../projects";

describe("newFileFromCommand", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("Right click on directory", async () => {
    const newFileFromContextMenuStub = sinon.stub(newFileCommand, "newFileFromContextMenu");

    const directoryPath = "/src";

    await newFileCommand.newFileFromCommand(directoryPath);

    sinon.assert.calledOnceWithExactly(newFileFromContextMenuStub, directoryPath);
  });

  it("No focused document", async () => {
    sinon.stub(newFileCommand, "getUriOfFocusedDocument").returns(null);
    sinon.stub(configuration, "respectFocusedDocument").returns(true);
    const newFileFromScratchStub = sinon.stub(newFileCommand, "newFileFromScratch");

    await newFileCommand.newFileFromCommand();

    sinon.assert.calledOnceWithExactly(newFileFromScratchStub, null);
  });

  it("No focused document and focused documents are ignored", async () => {
    sinon.stub(newFileCommand, "getUriOfFocusedDocument").returns(null);
    sinon.stub(configuration, "respectFocusedDocument").returns(false);
    const newFileFromScratchStub = sinon.stub(newFileCommand, "newFileFromScratch");

    await newFileCommand.newFileFromCommand();

    sinon.assert.calledOnceWithExactly(newFileFromScratchStub, null);
  });

  it("Focused document", async () => {
    const focusedDocument = vscode.Uri.file("/src/file.cs");

    sinon.stub(newFileCommand, "getUriOfFocusedDocument").returns(focusedDocument);
    sinon.stub(configuration, "respectFocusedDocument").returns(true);
    const newFileFromFocusedDocumentStub = sinon.stub(newFileCommand, "newFileFromFocusedDocument");

    await newFileCommand.newFileFromCommand();

    sinon.assert.calledOnceWithExactly(newFileFromFocusedDocumentStub, focusedDocument);
  });

  it("Focused document and focused documents are ignored", async () => {
    const focusedDocument = vscode.Uri.file("/src/file.cs");

    sinon.stub(newFileCommand, "getUriOfFocusedDocument").returns(focusedDocument);
    sinon.stub(configuration, "respectFocusedDocument").returns(false);
    const newFileFromScratchStub = sinon.stub(newFileCommand, "newFileFromScratch");

    await newFileCommand.newFileFromCommand();

    sinon.assert.calledOnceWithExactly(newFileFromScratchStub, focusedDocument);
  });
});

describe("newFileFromContextMenu", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("Directory is not part of workspace", async () => {
    const directoryPath = "/src";
    const directoryUri = vscode.Uri.file(directoryPath);

    const getWorkspaceFolderStub = sinon.stub(vscode.workspace, "getWorkspaceFolder").returns(undefined);
    const newFileFromContextMenuSpy = sinon.spy(newFileCommand, "newFileFromContextMenu");

    await assert.rejects(newFileFromContextMenuSpy(directoryPath));

    sinon.assert.calledOnceWithExactly(getWorkspaceFolderStub, directoryUri);
  });

  it("No project files", async () => {
    const directoryPath = "/src";
    const directoryUri = vscode.Uri.file(directoryPath);
    const workspaceFolder: vscode.WorkspaceFolder = { index: 0, name: "Workspace", uri: directoryUri };

    sinon.stub(vscode.workspace, "getWorkspaceFolder").returns(workspaceFolder);
    sinon.stub(projects, "getProjectFileUris").returns(Promise.resolve([]));
    const newFileFromContextMenuSpy = sinon.spy(newFileCommand, "newFileFromContextMenu");

    await assert.rejects(newFileFromContextMenuSpy(directoryPath));
  });

  it("Project found", async () => {
    const directoryPath = "/src";
    const directoryUri = vscode.Uri.file(directoryPath);
    const workspaceFolder: vscode.WorkspaceFolder = { index: 0, name: "Workspace", uri: directoryUri };
    const projectFile = vscode.Uri.joinPath(directoryUri, "test.csproj");

    sinon.stub(vscode.workspace, "getWorkspaceFolder").returns(workspaceFolder);
    sinon.stub(projects, "getProjectFileUris").returns(Promise.resolve([]));
    sinon.stub(projects, "getNearestProjectFile").returns(projectFile);
    const newFileFromDirectoryStub = sinon.stub(newFileCommand, "newFileFromDirectory");

    await newFileCommand.newFileFromContextMenu(directoryPath);

    sinon.assert.calledOnceWithExactly(newFileFromDirectoryStub, projectFile, directoryUri);
  });
});
