import * as path from "path";
import * as fs from "fs";

export function sanitizeName(input: string): string {
  return input;
}

export function getFilePath(dir: string, filename: string): string {
  return dir + path.sep + filename + ".cs";
}

export function fileExists(path: string) {
  return fs.existsSync(path);
}

export function getTemplatePath(
  extensionPath: string,
  templateName: string
): string | null {
  return extensionPath + path.sep + "templates" + path.sep + templateName;
}
