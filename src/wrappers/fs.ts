import * as fs from "fs";
import { WriteFileOptions } from "fs";

class FileSystemWrapper {
  fileExists(filepath: string): boolean {
    return fs.existsSync(filepath);
  }

  writeToFile(filepath: string, data: any, options?: WriteFileOptions) {
    fs.writeFileSync(filepath, data, options);
  }

  getFiles(path: string): string[] {
    return fs.readdirSync(path);
  }
}

export default new FileSystemWrapper();
