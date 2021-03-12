import vscode from "../wrappers/vscode";
import * as fs from "fs";
import * as path from "path";
import { selectFileDirectory } from "./selectFileDirectory";
import { fileNameRegex } from "../constants";
import { getNamespace, getProjectFile } from "../helpers";
import { showDocumentFromFile, openDocument, selectFilename, selectTemplate } from "../vsHelpers";
import { SnippetString } from "vscode";
import { getTemplates } from "../templates";

export default async function newFile(directoryPath: string | null): Promise<void> {
  directoryPath = directoryPath ?? (await selectFileDirectory());

  if (directoryPath === null) {
    console.warn("Directory could not be determined");
    return;
  }

  const templates = getTemplates();

  const selectedTemplate = await selectTemplate(templates);

  console.log(`Creating new '${selectedTemplate.name}' in '${directoryPath}' ...`);

  let filename, filepath;

  // todo: introduce better way to handle special cases like this
  if (selectedTemplate.name === "IServiceCollection Extension") {
    filename = "ServiceCollectionExtensions";
    filepath = path.join(directoryPath, filename + ".cs");

    if (fs.existsSync(filepath)) {
      vscode.displayError("File already exists", { modal: true });
      return;
    }
  } else {
    while (true) {
      filename = await selectFilename(directoryPath);

      if (filename === null) {
        return;
      }

      if (!fileNameRegex.test(filename)) {
        vscode.displayError("Name contains invalid characters", { modal: true });
        continue;
      }

      filepath = path.join(directoryPath, filename + ".cs");

      if (fs.existsSync(filepath)) {
        vscode.displayError("File already exists", { modal: true });
        continue;
      }

      break;
    }

    console.log("Filename:", filename);
  }

  const workspaceFolders = vscode.getWorkspaceFolders();

  if (workspaceFolders === null) {
    vscode.displayWarning("No Workspace selected");
    return;
  }

  const projectFile = getProjectFile(
    filepath,
    workspaceFolders.map((i) => i.uri.fsPath)
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

  const templateDocument = await openDocument(selectedTemplate.filepath);
  const templateContent = templateDocument
    .getText()
    .replace(/\${name}/g, filename)
    .replace(/\${namespace}/g, namespace);

  fs.closeSync(fs.openSync(filepath, "w"));

  const editor = await showDocumentFromFile(filepath);

  editor.insertSnippet(new SnippetString(templateContent));

  console.log("Successfully created file!");
}
