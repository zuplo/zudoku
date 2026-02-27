import { Fragment } from "react";
import { useFormContext } from "react-hook-form";
import { parseArrayParamValue } from "../createUrl.js";
import type { PlaygroundForm } from "../Playground.js";

export const UrlQueryParams = () => {
  const { watch } = useFormContext<PlaygroundForm>();
  const queryParams = watch("queryParams");

  const expandedParams = queryParams
    .filter((p) => p.active && p.name)
    .flatMap((p) => {
      if (p.isArray) {
        const values = parseArrayParamValue(p.value);
        return values.map((v) => ({ name: p.name, value: v }));
      }
      return [{ name: p.name, value: p.value }];
    });

  const urlQueryParams = expandedParams.map((p, i, arr) => (
    <Fragment key={`${i}-${p.name}-${p.value}`}>
      {p.name}={encodeURIComponent(p.value).replaceAll("%20", "+")}
      {i < arr.length - 1 && "&"}
      <wbr />
    </Fragment>
  ));

  return (
    <>
      {urlQueryParams.length > 0 ? `?` : ""}
      {urlQueryParams}
    </>
  );
};
