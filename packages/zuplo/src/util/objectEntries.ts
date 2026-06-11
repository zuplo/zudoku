type ValueOf<T> = T[keyof T];
type Entries<T> = [keyof T, ValueOf<T>][];

export const objectEntries = <T extends object>(obj: T): Entries<T> =>
  Object.entries(obj) as Entries<T>;
