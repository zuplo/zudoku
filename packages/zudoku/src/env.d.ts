declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ZUDOKU_ENV: "standalone" | "internal" | "module";
      ZUPLO_BUILD_ID?: string;
      IS_ZUPLO: string;
    }
  }
}

export {};
