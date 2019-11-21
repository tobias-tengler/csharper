import path from "./wrappers/path";
import fs from "./wrappers/fs";

export function getFilePath(dir: string, filename: string): string {
  return dir + path.seperator + filename + ".cs";
}

export function getTemplatePath(
  extensionPath: string,
  templateName: string
): string | null {
  return (
    extensionPath + path.seperator + "templates" + path.seperator + templateName
  );
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
      .getFiles(currentDirectory, {
        withFileTypes: true
      })
      .filter(i => i.name.endsWith(".csproj"));

    if (files.length > 0) {
      return currentDirectory + path.seperator + files[0].name;
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

  if (fileDirectory.startsWith(path.seperator)) {
    fileDirectory = fileDirectory.substring(1);
  }

  return rootNamespace + "." + fileDirectory.replace(path.seperator, ".");
}
