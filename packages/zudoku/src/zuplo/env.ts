export const ZuploEnv = {
  /**
   * Indicates that the build is running in Zuplo "mode"
   */
  get isZuplo(): boolean {
    return process.env.ZUPLO === "1";
  },
};
