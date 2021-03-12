import { getExtensionPath } from "./vsHelpers";
import * as fs from "fs";
import * as path from "path";
import { TemplateFile } from "./types/TemplateFile";

function getTemplateDir() {
  const extensionPath = getExtensionPath();

  if (!extensionPath) throw new Error("Extension path could not be determined");

  return path.join(extensionPath, "templates");
}

export function getTemplates(): TemplateFile[] {
  const templateDir = getTemplateDir();

  const templateFiles = fs.readdirSync(templateDir);

  return templateFiles.map((templateFile) => ({
    filepath: path.join(templateDir, templateFile),
    name: templateFile,
  }));
}
