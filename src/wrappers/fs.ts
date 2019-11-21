import * as fs from "fs";
import { WriteFileOptions, Dirent } from "fs";

class FileSystemWrapper {
  fileExists(filepath: string): boolean {
    return fs.existsSync(filepath);
  }

  writeToFile(filepath: string, data: any, options?: WriteFileOptions) {
    fs.writeFileSync(filepath, data, options);
  }

  getFiles(
    path: string,
    options: { encoding?: string | null; withFileTypes: true }
  ): Dirent[] {
    return fs.readdirSync(path, options);
  }
}

export default new FileSystemWrapper();
