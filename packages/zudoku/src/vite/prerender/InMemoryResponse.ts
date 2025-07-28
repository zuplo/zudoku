import type { PrerenderResponse } from "./PrerenderResponse.js";

export class InMemoryResponse implements PrerenderResponse {
  private resolve = () => {};
  private resolved = new Promise<void>((res) => {
    this.resolve = res;
  });

  public buffer = "";
  public redirectedTo?: string;
  public statusCode = 200;

  set() {}
  status(status: number) {
    this.statusCode = status;
  }
  on() {}

  redirect(status: number, url: string) {
    this.statusCode = status;
    this.redirectedTo = url;
    void this.end();
  }

  async send(chunk: string) {
    this.write(chunk);
    await this.end();
  }

  write(chunk: string, _encoding?: string) {
    this.buffer += chunk;
  }

  async end(chunk = "") {
    this.buffer += chunk;
    this.resolve();
  }

  isSent() {
    return this.resolved;
  }
}
