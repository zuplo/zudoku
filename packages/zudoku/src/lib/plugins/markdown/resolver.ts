import { ZudokuDocsConfig } from "../../../config/validators/common.js";
import { ZudokuConfig } from "../../../config/validators/validate.js";

const DEFAULT_DOCS_FILES = "/pages/**/*.{md,mdx}";

/**
 * Utilities for resolving markdown file paths and routes
 */
export class DocResolver {
  constructor(private config: ZudokuConfig) {}

  fileMap = new Map<string, string>();

  /**
   * Gets the default docs config from the zudoku config
   */
  getDocsConfigs() {
    const docsConfigs: ZudokuDocsConfig[] = this.config.docs
      ? Array.isArray(this.config.docs)
        ? this.config.docs
        : [this.config.docs]
      : [{ files: DEFAULT_DOCS_FILES }];

    return docsConfigs;
  }

  /**
   * Gets the root directory from a files glob
   */
  private static getRootDir(filesGlob: string) {
    let rootDir = filesGlob.split("**")[0];
    if (!rootDir) {
      throw new Error("Invalid files glob. Must have '**' in the path.");
    }
    rootDir = rootDir.replace("/**", "/");
    return rootDir;
  }

  /**
   * Resolves the route path for a given file system path
   * @param options - The options to resolve the route path
   * @returns The string route path
   */
  static resolveRoutePath({
    filesGlob,
    fsPath,
  }: {
    filesGlob: string;
    fsPath: string;
  }) {
    const rootDir = this.getRootDir(filesGlob);
    const re = new RegExp(`^${rootDir}(.*).mdx?`);
    const match = fsPath.match(re);
    const routePath = match?.at(1);
    return routePath;
  }
}
