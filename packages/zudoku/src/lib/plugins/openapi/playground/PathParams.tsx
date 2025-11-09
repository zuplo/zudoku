import { type Control, Controller, useFieldArray } from "react-hook-form";
import { ColorizedParam } from "../ColorizedParam.js";
import ParamsGrid, { ParamsGridInput, ParamsGridItem } from "./ParamsGrid.js";
import type { PlaygroundForm } from "./Playground.js";

export const PathParams = ({
  control,
  url,
}: {
  control: Control<PlaygroundForm>;
  url: string;
}) => {
  const { fields } = useFieldArray<PlaygroundForm, "pathParams">({
    control,
    name: "pathParams",
  });

  const sortedFields = [...fields].sort(
    (a, b) => url.indexOf(`{${a.name}}`) - url.indexOf(`{${b.name}}`),
  );

  return (
    <ParamsGrid>
      {sortedFields.map((field, i) => (
        <ParamsGridItem key={field.id}>
          <Controller
            control={control}
            name={`pathParams.${i}.name`}
            render={() => (
              <div className="flex items-center">
                <ColorizedParam
                  slug={field.name}
                  name={field.name}
                  className="font-mono text-xs px-2"
                />
              </div>
            )}
          />

          <div className="flex justify-between items-center col-span-2">
            <Controller
              control={control}
              name={`pathParams.${i}.value`}
              render={({ field }) => (
                <ParamsGridInput {...field} required placeholder="Value" />
              )}
            />
          </div>
        </ParamsGridItem>
      ))}
    </ParamsGrid>
  );
};
