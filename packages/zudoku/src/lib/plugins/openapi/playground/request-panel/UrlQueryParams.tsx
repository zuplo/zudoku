import { Fragment } from "react";
import { useFormContext } from "react-hook-form";
import type { PlaygroundForm } from "../Playground.js";
import { serializeQueryString } from "../serializeQueryParams.js";

export const UrlQueryParams = () => {
  const { watch } = useFormContext<PlaygroundForm>();
  const queryParams = watch("queryParams");

  const queryString = serializeQueryString(queryParams);

  if (!queryString) return null;

  const parts = queryString.split("&");

  return (
    <>
      ?
      {parts.map((part, i) => (
        <Fragment key={`${i}-${part}`}>
          {part}
          {i < parts.length - 1 && "&"}
          <wbr />
        </Fragment>
      ))}
    </>
  );
};
