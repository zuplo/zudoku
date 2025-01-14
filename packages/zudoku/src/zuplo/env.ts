export const ZuploEnv = {
  /**
   * Indicates that the build is running in Zuplo "mode"
   */
  get isZuplo(): boolean {
    return process.env.ZUPLO === "1";
  },

  get host(): string | undefined {
    return process.env.ZUP_HOST;
  },
};
