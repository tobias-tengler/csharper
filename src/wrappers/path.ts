import * as path from "path";

class PathWrapper {
  get seperator() {
    return path.sep;
  }

  dirname(filepath: string): string {
    return path.dirname(filepath);
  }

  basename(filepath: string, extension?: string): string {
    return path.basename(filepath, extension);
  }

  resolve(...pathSegments: string[]): string {
    return path.resolve(...pathSegments);
  }
}

export default new PathWrapper();
