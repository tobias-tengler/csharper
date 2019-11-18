import {
  selectTemplate,
  selectFilename,
  displayError,
  getRootPath,
  getExtensionPath,
  showDocumentFromFile,
  openDocument,
  setCursorPosition,
  getWorkspaceFolderUris
} from "./vsHelpers";
import {
  getFilePath,
  fileExists,
  getTemplatePath,
  writeToFile,
  getProjectFile,
  getNamespace
} from "./helpers";
import { templates, fileNameRegex } from "./constants";

export async function newFileAction(args: any) {
  const directory = args?.fsPath ?? getRootPath();

  if (directory === null) {
    return;
  }

  const templateName = await selectTemplate(templates);

  if (templateName === null) {
    return;
  }

  console.log(`Creating new '${templateName}' in '${directory}' ...`);

  let filename, filepath;

  while (true) {
    filename = await selectFilename();

    if (filename === null) {
      return;
    }

    if (!fileNameRegex.test(filename)) {
      displayError("Name contains invalid characters");
      continue;
    }

    filepath = getFilePath(directory, filename);

    if (fileExists(filepath)) {
      displayError("File already exists");
      continue;
    }

    break;
  }

  console.log("Filename:", filename);

  const workspaceFolders = getWorkspaceFolderUris();

  if (workspaceFolders === null) {
    return;
  }

  const projectFile = getProjectFile(filepath, workspaceFolders);

  if (projectFile === null) {
    return;
  }

  const namespace = getNamespace(projectFile, filepath);

  if (namespace === null) {
    return;
  }

  console.log("Namespace:", namespace);

  const extensionPath = getExtensionPath();

  if (extensionPath === null) {
    return;
  }

  console.log("Extension Path:", extensionPath);

  const templatePath = getTemplatePath(extensionPath, templateName);

  if (templatePath === null) {
    return;
  }

  const templateDocument = await openDocument(templatePath);
  const templateContent = templateDocument.getText();
  const cursorTextPosition = templateContent.indexOf("${cursor}");
  const cursorPosition = templateDocument.positionAt(cursorTextPosition);

  let newFileContent = templateContent.replace("${cursor}", "");
  newFileContent = newFileContent.replace("${name}", filename);
  newFileContent = newFileContent.replace("${namespace}", namespace);

  writeToFile(filepath, newFileContent);

  const editor = await showDocumentFromFile(filepath);

  setCursorPosition(editor, cursorPosition);

  console.log("Successfully created file!");
}
