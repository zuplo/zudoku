export const createWaitForNotify = <T extends NonNullable<unknown>>() => {
  const resolveMap = new Map<string, (value: T | PromiseLike<T>) => void>();

  const waitFor = (id: string) =>
    new Promise<T>((resolve) => {
      resolveMap.set(id, resolve);
    });

  const notify = (id: string, data: T) => {
    const resolveFn = resolveMap.get(id);
    if (resolveFn) {
      resolveFn(data);
      resolveMap.delete(id);
    }
  };

  return [waitFor, notify] as const;
};
