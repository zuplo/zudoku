import { Control, Controller, useFieldArray } from "react-hook-form";
import { Card } from "zudoku/ui/Card.js";
import { Input } from "../../../ui/Input.js";
import { ColorizedParam, useParamColor } from "../ColorizedParam.js";
import type { PlaygroundForm } from "./Playground.js";

const PathParamLabel = ({ name }: { name: string }) => {
  const color = useParamColor(name);

  return (
    <div className="flex items-center">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: `hsl(${color})` }}
      />

      <ColorizedParam
        slug={name}
        name={name}
        className="font-mono text-xs m-2 px-1"
      />
    </div>
  );
};

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
      <table className="w-full">
        <tbody>
          {fields.map((part, i) => (
            <tr key={part.id} className="hover:bg-accent/40">
              <td className="w-5/12">
                <Controller
                  control={control}
                  name={`pathParams.${i}.value`}
                  render={() => <PathParamLabel name={part.name} />}
                />
              </td>
              <td className="w-7/12">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};
