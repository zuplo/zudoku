import { type Control, Controller, useFieldArray } from "react-hook-form";
import { Card } from "zudoku/ui/Card.js";
import { Input } from "../../../ui/Input.js";
import { ColorizedParam } from "../ColorizedParam.js";
import ParamsGrid, { ParamsGridItem } from "./ParamsGrid.js";
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
    <Card className="rounded-lg">
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

            <div className="flex justify-between items-center">
              <Controller
                control={control}
                name={`pathParams.${i}.value`}
                render={({ field }) => (
                  <Input
                    {...field}
                    required
                    placeholder="Enter value"
                    className="w-full border-0 shadow-none text-xs font-mono focus-visible:ring-0"
                  />
                )}
              />
            </div>
          </ParamsGridItem>
        ))}
      </ParamsGrid>
    </Card>
  );
};
