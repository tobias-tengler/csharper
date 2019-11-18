import * as path from "path";
import * as fs from "fs";

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

function getItemContainingLongestMatch(
  items: string[],
  input: string
): string | null {
  if (items.length < 1) {
    return null;
  }

  if (items.length === 1) {
    return items[0];
  }

  let longestIndex = -1;
  let longestValue = input.length;

  items.forEach((item, index) => {
    const length = input.replace(item, "").length;

    if (length < longestValue) {
      longestIndex = index;
    }
  });

  if (longestIndex === -1) {
    return null;
  }

  return items[longestIndex];
}

export function getProjectFile(
  filepath: string,
  workspaceFolders: string[]
): string | null {
  const workspaceRoot = getItemContainingLongestMatch(
    workspaceFolders,
    filepath
  );

  if (workspaceRoot === null) {
    return null;
  }

  let currentDirectory = path.dirname(filepath);

  while (true) {
    const files = fs
      .readdirSync(currentDirectory)
      .filter(i => i.endsWith(".csproj"));

    if (files.length > 0) {
      return currentDirectory + path.sep + files[0];
    }

    if (currentDirectory === workspaceRoot) {
      break;
    }

    currentDirectory = path.resolve(currentDirectory, "..");
  }

  return null;
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
