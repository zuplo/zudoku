// biome-ignore lint/suspicious/noExplicitAny: Generic type
export type RecordAny = Record<string, any>;

export const traverse = <T extends RecordAny>(
  obj: T,
  fn: (obj: RecordAny) => RecordAny,
): T => fn(obj) as T;
