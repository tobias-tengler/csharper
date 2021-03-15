import * as jest from "jest";
import * as path from "path";

const jestTestRunnerForVSCodeE2E = {
  run(testsRoot: string, reportTestResults: (error?: Error, failures?: number) => void): void {
    // todo: maybe use tests root
    const projectRootPath = path.join(process.cwd(), "../..");
    const config = path.join(projectRootPath, "jest.config.js");

    jest
      .runCLI({ config } as any, [projectRootPath])
      .then((jestCliCallResult) => {
        reportTestResults(undefined, jestCliCallResult.results.numFailedTests);
      })
      .catch((errorCaughtByJestRunner) => {
        reportTestResults(errorCaughtByJestRunner, 0);
      });
  },
};

module.exports = jestTestRunnerForVSCodeE2E;
