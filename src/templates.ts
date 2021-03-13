import { extensions, Uri } from "vscode";
import { PathItem } from "./types/PathItem";
import * as path from "path";
import * as vscode from "vscode";

function getExtensionPath(): string | null {
  return extensions.getExtension("tobiastengler.csharper")?.extensionPath ?? null;
}

function getTemplateDirectory() {
  const extensionPath = getExtensionPath();

  if (!extensionPath) throw new Error("Extension path could not be determined");

  const templateDir = path.join(extensionPath, "templates");

  return Uri.parse(templateDir);
}

export async function getTemplates() {
  const templateDir = getTemplateDirectory();

  const templateFiles = await vscode.workspace.fs.readDirectory(templateDir);

  return templateFiles
    .map((i) => i[0])
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map<PathItem>((templateFile) => ({
      uri: Uri.parse(path.join(templateDir.fsPath, templateFile)),
      label: templateFile.replace(/(^\d+\s)/, ""),
    }));
}
