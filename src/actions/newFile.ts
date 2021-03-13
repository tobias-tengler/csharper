import * as fs from "fs";
import * as path from "path";
import { showDocumentFromFile, openDocument, selectFilename, selectTemplate, selectDirectory } from "../vsHelpers";
import { SnippetString, window } from "vscode";
import { getTemplates } from "../templates";

export default async function newFile(directoryPath: string | null): Promise<void> {
  let fromContext = true;

  if (!directoryPath) {
    directoryPath = await selectDirectory();
    fromContext = false;
  }

  if (!directoryPath) {
    console.warn("Directory could not be determined");
    return;
  }

  const templates = getTemplates();

  const selectedTemplate = await selectTemplate(templates, fromContext);

  console.log(`Creating new '${selectedTemplate.label}' in '${directoryPath}' ...`);

  let filename, filepath;

  filename = await selectFilename(directoryPath, fromContext);

  console.log("Filename:", filename);

  filepath = path.join(directoryPath, filename + ".cs");

  const projectFile = getProjectFile();

  if (projectFile === null) {
    window.showWarningMessage("C# Project File could not be determined");
    return;
  }

  const namespace = getNamespace(projectFile, filepath);

  if (namespace === null) {
    window.showWarningMessage("Namespace of C# Project could not be determined");
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

export function getProjectFile() {
  // todo: implement
  return "";
}

export function getNamespace(projectFile: string, filepath: string): string {
  const rootNamespace = path.basename(projectFile).replace(".csproj", "");

  const rootDirectory = path.dirname(projectFile);
  let fileDirectory = path.dirname(filepath).replace(rootDirectory, "");

  if (fileDirectory.length <= 1) {
    return rootNamespace;
  }

  if (fileDirectory.startsWith(path.sep)) {
    fileDirectory = fileDirectory.substring(1);
  }

  return rootNamespace + "." + fileDirectory.replace(path.sep, ".");
}
