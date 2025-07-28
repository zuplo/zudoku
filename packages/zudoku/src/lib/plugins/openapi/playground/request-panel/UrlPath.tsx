import { useFormContext } from "react-hook-form";
import { PathRenderer } from "../../../../components/PathRenderer.js";
import { ColorizedParam } from "../../ColorizedParam.js";
import type { PlaygroundForm } from "../Playground.js";

export const UrlPath = ({ url }: { url: string }) => {
  const { watch, setFocus } = useFormContext<PlaygroundForm>();
  const [pathParams] = watch(["pathParams"]);

  return (
    <PathRenderer
      path={url}
      renderParam={({ name, originalValue, index }) => {
        const formValue = pathParams.find(
          (param) => param.name === name,
        )?.value;

        return (
          <ColorizedParam
            name={name}
            backgroundOpacity="0"
            slug={name}
            onClick={() => setFocus(`pathParams.${index}.value`)}
          >
            {formValue || originalValue}
          </ColorizedParam>
        );
      }}
    />
  );
};
