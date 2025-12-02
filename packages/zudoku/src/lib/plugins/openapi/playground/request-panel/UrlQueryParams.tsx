import { Fragment } from "react";
import { useFormContext } from "react-hook-form";
import type { PlaygroundForm } from "../Playground.js";

export const UrlQueryParams = () => {
  const { watch } = useFormContext<PlaygroundForm>();
  const queryParams = watch("queryParams");

  const urlQueryParams = queryParams
    .filter((p) => p.active && p.name)
    .map((p, i, arr) => (
      <Fragment key={`${i}-${p.name}`}>
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
