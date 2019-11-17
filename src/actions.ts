import {
  selectTemplate,
  selectFilename,
  displayError,
  getRootPath,
  getExtensionPath
} from "./vsHelpers";
import { getFilePath, fileExists, getTemplatePath } from "./helpers";
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

  const extennsionPath = getExtensionPath();

  if (extennsionPath === null) {
    return;
  }

  const templatePath = getTemplatePath(extennsionPath, templateName);

  if (templatePath === null) {
    return;
  }

  console.log(filepath, templatePath);
}
