import fs from "node:fs/promises";
import path from "path";

export class FileWritingResponse {
  private buffer = "";
  private dontSave = false;
  private resolve = () => {};
  private resolved = new Promise<void>((res) => (this.resolve = res));

  set() {}
  status(status: number) {
    if (status >= 300) {
      this.dontSave = true;
    }
  }
  on() {}

  constructor(private readonly fileName: string) {}

  redirect(_status: number, url: string) {
    void this.end(
      `<!doctype html><meta http-equiv="refresh" content="0; url=${url}">`,
    );
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
      await fs.mkdir(path.dirname(this.fileName), { recursive: true });
      await fs.writeFile(this.fileName, this.buffer + chunk);
    }
    this.resolve();
  }

  isSent() {
    return this.resolved;
  }
}
