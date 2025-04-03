export interface PrerenderResponse {
  set(): void;
  status(status: number): void;
  on(): void;
  redirect(status: number, url: string): void;
  send(chunk: string): Promise<void>;
  write(chunk: string, encoding?: string): void;
  end(chunk?: string): Promise<void>;
  isSent(): Promise<void>;
}
