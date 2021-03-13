import * as fs from "fs";
import * as path from "path";
import { extensions } from "vscode";
import { TemplateFile } from "./types/TemplateFile";

function getExtensionPath(): string | null {
  return extensions.getExtension("tobiastengler.csharper")?.extensionPath ?? null;
}

function getTemplateDir() {
  const extensionPath = getExtensionPath();

  if (!extensionPath) throw new Error("Extension path could not be determined");

  return path.join(extensionPath, "templates");
}

export function getTemplates(): TemplateFile[] {
  const templateDir = getTemplateDir();

  const templateFiles = fs.readdirSync(templateDir);

  return templateFiles
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((templateFile) => ({
      filepath: path.join(templateDir, templateFile),
      label: templateFile.replace(/(^\d+\s)/, ""),
    }));
}
