import * as fs from "fs";
import { WriteFileOptions, Dirent } from "fs";

class FileSystemWrapper {
  fileExists(filepath: string): boolean {
    return fs.existsSync(filepath);
  }

  writeToFile(filepath: string, data: any, options?: WriteFileOptions) {
    fs.writeFileSync(filepath, data, options);
  }

  getFiles(path: string, options: Parameters<typeof fs.readdirSync>[1]): Dirent[] {
    return fs.readdirSync(path, options);
  }
}

export default new FileSystemWrapper();
