import { useFormContext } from "react-hook-form";
import type { PlaygroundForm } from "./Playground.js";

export const UrlDisplay = ({ host, path }: { host: string; path: string }) => {
  const { watch } = useFormContext<PlaygroundForm>();
  const data = watch();
  const url = new URL(
    host +
      path
        .split("/")
        .map((v) =>
          v.startsWith("{") && v.endsWith("}")
            ? (data.pathParams.find((part) => part.name === v.slice(1, -1))
                ?.value ?? v)
            : v,
        )
        .join("/"),
  );

  data.queryParams.forEach((param) => {
    if (!param.value) {
      return;
    }
    url.searchParams.set(param.name, param.value);
  });

  return (
    <div className="overflow-auto font-mono whitespace-nowrap">
      {url.toString()}
    </div>
  );
};
