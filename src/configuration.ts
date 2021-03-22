import * as vscode from "vscode";

function getConfiguration<T>(key: string, defaultValue: T) {
  const configuration = vscode.workspace.getConfiguration("csharper");

  return configuration.get<T>(key, defaultValue);
}

class Configuration {
  useNamespaceOfNeighboringFiles() {
    return getConfiguration<boolean>("useNamespaceOfNeighboringFiles", true);
  }

  respectFocusedDocument() {
    return getConfiguration<boolean>("respectFocusedDocument", true);
  }

  includeNamespace() {
    return getConfiguration<boolean>("includeNamespace", true);
  }

  includeSubdirectoriesInNamespace() {
    return getConfiguration<boolean>("includeSubdirectoriesInNamespace", true);
  }
}

export const configuration = new Configuration();
