import { rowsToUrlEncoded } from "../util/formatRequestBody.js";
import type { PlaygroundForm } from "./Playground.js";

export type ContentTypeAction =
  | { kind: "preserve" }
  | { kind: "remove" }
  | { kind: "override"; value: string };

export type BuiltRequestBody = {
  body: string | FormData | File | undefined;
  contentType: ContentTypeAction;
};

export const buildRequestBody = (form: PlaygroundForm): BuiltRequestBody => {
  switch (form.bodyMode) {
    case "file":
      return {
        body: form.file || undefined,
        contentType: { kind: "remove" },
      };
    case "multipart": {
      const formData = new FormData();
      form.multipartFormFields
        ?.filter((f) => f.name && f.active)
        .forEach((f) => formData.append(f.name, f.value));
      return { body: formData, contentType: { kind: "remove" } };
    }
    case "urlencoded": {
      const rows = (form.urlencodedFormFields ?? [])
        .filter((f) => f.name && f.active)
        .map((f) => ({ name: f.name, value: f.value }));
      return {
        body: rowsToUrlEncoded(rows),
        contentType: {
          kind: "override",
          value: "application/x-www-form-urlencoded",
        },
      };
    }
    default:
      return {
        body: form.body || undefined,
        contentType: { kind: "preserve" },
      };
  }
};
