import * as vscode from "vscode";

function getConfiguration<T>(key: string, defaultValue: T) {
  const configuration = vscode.workspace.getConfiguration("csharper");

  return configuration.get<T>(key, defaultValue);
}

export function useNamespaceOfNeighboringFiles() {
  return getConfiguration<boolean>("useNamespaceOfNeighboringFiles", true);
}

export function respectFocusedDocument() {
  return getConfiguration<boolean>("respectFocusedDocument", true);
}

export function includeNamespace() {
  return getConfiguration<boolean>("includeNamespace", true);
}

export function includeSubdirectoriesInNamespace() {
  return getConfiguration<boolean>("includeSubdirectoriesInNamespace", true);
}
