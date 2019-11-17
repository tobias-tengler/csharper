import * as path from "path";
import * as fs from "fs";

export function sanitizeName(input: string): string {
  return input;
}

export function getFilePath(dir: string, filename: string): string {
  return dir + path.sep + filename + ".cs";
}

export function fileExists(filepath: string) {
  return fs.existsSync(filepath);
}

export function getTemplatePath(
  extensionPath: string,
  templateName: string
): string | null {
  return extensionPath + path.sep + "templates" + path.sep + templateName;
}

export function writeToFile(filepath: string, data: any) {
  fs.writeFileSync(filepath, data);
}
