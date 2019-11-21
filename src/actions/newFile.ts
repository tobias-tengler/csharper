import vscode from "../wrappers/vscode";
import fs from "../wrappers/fs";
import { selectFileDirectory } from "./selectFileDirectory";
import { templates, fileNameRegex } from "../constants";
import {
  getTemplatePath,
  getNamespace,
  getProjectFile,
  getFilePath
} from "../helpers";
import {
  setCursorPosition,
  showDocumentFromFile,
  openDocument,
  getExtensionPath,
  selectFilename,
  selectTemplate
} from "../vsHelpers";

export default async function newFile(
  directoryPath: string | null
): Promise<void> {
  directoryPath = directoryPath ?? (await selectFileDirectory());

  if (directoryPath === null) {
    console.warn("Directory could not be determined");
    return;
  }

  const templateName = await selectTemplate(templates);

  if (templateName === null) {
    return;
  }

  console.log(`Creating new '${templateName}' in '${directoryPath}' ...`);

  let filename, filepath;

  while (true) {
    filename = await selectFilename();

    if (filename === null) {
      return;
    }

    if (!fileNameRegex.test(filename)) {
      vscode.displayError("Name contains invalid characters", { modal: true });
      continue;
    }

    filepath = getFilePath(directoryPath, filename);

    if (fs.fileExists(filepath)) {
      vscode.displayError("File already exists", { modal: true });
      continue;
    }

    break;
  }

  console.log("Filename:", filename);

  const workspaceFolders = vscode.getWorkspaceFolders();

  if (workspaceFolders === null) {
    vscode.displayWarning("No Workspace selected");
    return;
  }

  const projectFile = getProjectFile(
    filepath,
    workspaceFolders.map(i => i.uri.fsPath)
  );

  if (projectFile === null) {
    vscode.displayWarning("C# Project File could not be determined");
    return;
  }

  const namespace = getNamespace(projectFile, filepath);

  if (namespace === null) {
    vscode.displayWarning("Namespace of C# Project could not be determined");
    return;
  }

  const extensionPath = getExtensionPath();

  if (extensionPath === null) {
    vscode.displayWarning("Extension path could not be determined");
    return;
  }

  console.log("Extension Path:", extensionPath);

  const templatePath = getTemplatePath(extensionPath, templateName);

  if (templatePath === null) {
    vscode.displayWarning("Template Path could not be determined");
    return;
  }

  const templateDocument = await openDocument(templatePath);
  const templateContent = templateDocument.getText();
  const cursorTextPosition = templateContent.indexOf("${cursor}");
  const cursorPosition = templateDocument.positionAt(cursorTextPosition);

  let newFileContent = templateContent.replace("${cursor}", "");
  newFileContent = newFileContent.replace("${name}", filename);
  newFileContent = newFileContent.replace("${namespace}", namespace);

  fs.writeToFile(filepath, newFileContent);

  const editor = await showDocumentFromFile(filepath);

  setCursorPosition(editor, cursorPosition);

  console.log("Successfully created file!");
}
