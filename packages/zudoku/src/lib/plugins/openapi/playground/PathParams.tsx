import { Control, Controller, useFieldArray } from "react-hook-form";
import { Card } from "zudoku/ui/Card.js";
import { Input } from "../../../ui/Input.js";
import { ColorizedParam } from "../ColorizedParam.js";
import ParamsGrid from "./ParamsGrid.js";
import type { PlaygroundForm } from "./Playground.js";

export const PathParams = ({
  control,
}: {
  control: Control<PlaygroundForm>;
}) => {
  const { fields } = useFieldArray<PlaygroundForm>({
    control,
    name: "pathParams",
  });

  return (
    <Card className="rounded-lg">
      <ParamsGrid>
        {fields.map((part, i) => (
          <>
            <Controller
              control={control}
              name={`pathParams.${i}.name`}
              render={() => (
                <div>
                  <ColorizedParam
                    slug={part.name}
                    name={part.name}
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
                    className="w-full border-0 shadow-none text-xs font-mono hover:bg-accent"
                  />
                )}
              />
            </div>
          </>
        ))}
      </ParamsGrid>
    </Card>
  );
};
