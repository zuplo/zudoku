export const TextColorMap = {
  green: "text-green-600",
  blue: "text-sky-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
  purple: "text-purple-600",
  indigo: "text-indigo-600",
  gray: "text-gray-600",
};

export const methodToColor = {
  get: TextColorMap.green,
  post: TextColorMap.blue,
  put: TextColorMap.yellow,
  delete: TextColorMap.red,
  patch: TextColorMap.purple,
  options: TextColorMap.indigo,
  head: TextColorMap.gray,
  trace: TextColorMap.gray,
};

export const methodForColor = (method: string) => {
  return (
    methodToColor[method.toLocaleLowerCase() as keyof typeof methodToColor] ??
    TextColorMap.gray
  );
};
