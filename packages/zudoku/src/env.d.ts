declare global {
  declare namespace NodeJS {
    interface ProcessEnv {
      ZUDOKU_ENV: "standalone" | "internal" | "module";
    }
  }
}

export {};
