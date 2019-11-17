import {
  selectTemplate,
  selectFilename,
  displayError,
  getRootPath,
  getExtensionPath,
  showDocumentFromFile,
  openDocument,
  setCursorPosition
} from "./vsHelpers";
import {
  getFilePath,
  fileExists,
  getTemplatePath,
  writeToFile
} from "./helpers";
import { templates } from "./constants";

export async function newFileAction(args: any) {
  const directory = args?.fsPath ?? getRootPath();

  if (directory === null) {
    return;
  }

  const templateName = await selectTemplate(templates);

  if (templateName === null) {
    return;
  }

  let filename, filepath;

  while (true) {
    filename = await selectFilename();

    if (filename === null) {
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(filename)) {
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

  const extensionPath = getExtensionPath();

  if (extensionPath === null) {
    return;
  }

  const templatePath = getTemplatePath(extensionPath, templateName);

  if (templatePath === null) {
    return;
  }

  const templateDocument = await openDocument(templatePath);
  const templateContent = templateDocument.getText();
  const cursorTextPosition = templateContent.indexOf("$cursor");
  const cursorPosition = templateDocument.positionAt(cursorTextPosition);

  let newFileContent = templateContent.replace("$cursor", "");
  newFileContent = newFileContent.replace("$name", filename);

  writeToFile(filepath, newFileContent);

  const editor = await showDocumentFromFile(filepath);

  setCursorPosition(editor, cursorPosition);
}
