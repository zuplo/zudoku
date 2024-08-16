export const renderIf = <G, R>(
  variable: G | undefined | null,
  callback: (variable: G) => R,
): R | undefined => (variable ? callback(variable) : undefined);
