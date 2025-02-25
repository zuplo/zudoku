import fs from "node:fs/promises";
import path from "path";

export class FileWritingResponse {
  private buffer = "";
  private dontSave = false;
  private resolve = () => {};
  private resolved = new Promise<void>((res) => (this.resolve = res));
  public redirectedTo?: string;
  public statusCode = 200;

  set() {}
  status(status: number) {
    this.statusCode = status;
    if (status >= 300) {
      this.dontSave = true;
    }
  }
  on() {}

  constructor(
    private options: {
      fileName: string;
      writeRedirects: boolean;
    },
  ) {}

  redirect(status: number, url: string) {
    this.statusCode = status;
    if (this.options.writeRedirects) {
      this.write(
        `<!doctype html><meta http-equiv="refresh" content="0; url=${url}">`,
      );
    } else {
      this.dontSave = true;
    }
    this.redirectedTo = url;
    void this.end();
  }

  send = async (chunk: string) => {
    this.write(chunk);
    await this.end();
  };

  write(chunk: string, _encoding?: string) {
    this.buffer += chunk;
  }

  async end(chunk = "") {
    if (!this.dontSave) {
      await fs.mkdir(path.dirname(this.options.fileName), { recursive: true });
      await fs.writeFile(this.options.fileName, this.buffer + chunk);
    }
    this.resolve();
  }

  isSent() {
    return this.resolved;
  }
}
