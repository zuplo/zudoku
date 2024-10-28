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

    if (Array.isArray(param.value)) {
      // If the parameter is an array then create multiple query params with the same name by comma separating the values
      param.value.forEach((value) => {
        url.searchParams.append(param.name, value);
      });
    } else {
      url.searchParams.set(param.name, param.value);
    }
  });

  return (
    <div className="overflow-auto font-mono whitespace-nowrap">
      {url.toString()}
    </div>
  );
};
