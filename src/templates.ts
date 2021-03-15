import { extensions, Uri } from "vscode";
import { PathItem } from "./types/PathItem";
import * as vscode from "vscode";

function getExtensionUri(): Uri | null {
  return extensions.getExtension("tobiastengler.csharper")?.extensionUri ?? null;
}

function getTemplateDirectory() {
  const extensionUri = getExtensionUri();

  if (!extensionUri) {
    throw new Error("Extension path could not be determined");
  }

  const templateDir = Uri.joinPath(extensionUri, "templates");

  return templateDir;
}

export async function getTemplates() {
  const templateDir = getTemplateDirectory();

  const templateFiles = await vscode.workspace.fs.readDirectory(templateDir);

  return templateFiles
    .map((i) => i[0])
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map<PathItem>((templateFile) => ({
      uri: Uri.joinPath(templateDir, templateFile),
      label: templateFile.replace(/(^\d+\s)/, ""),
    }));
}
