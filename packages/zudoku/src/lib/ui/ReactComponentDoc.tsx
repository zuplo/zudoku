import { Badge } from "./Badge.js";
import { Card } from "./Card.js";

type PropType =
  | string
  | {
      name: string;
      description: string;
      required: boolean;
    };

type ReactComponentDocProps = {
  component: {
    __docgenInfo: {
      displayName: string;
      description: string;
      props: Record<
        string,
        {
          type: PropType;
          description: string;
          required: boolean;
        }
      >;
    };
  };
};

export const ReactComponentDoc = ({ component }: ReactComponentDocProps) => {
  const docgen = component.__docgenInfo;

  if (!docgen) return null;

  return (
    <Card className="not-prose">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2  border-b p-6">
          <h2 className="text-lg font-medium">Component Properties</h2>
          <p className="text-sm text-muted-foreground">
            The properties of the component.
          </p>
        </div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 divide-y">
          {Object.entries(docgen.props).map(([key, value]) => (
            <div
              key={key}
              className="px-6 pb-2 col-span-full grid grid-cols-subgrid"
            >
              <span className="font-medium text-primary">{key}</span>
              <div>
                {value.required && (
                  <Badge className="ml-2 font-mono">required</Badge>
                )}
              </div>
              <div>
                {typeof value.type === "object" && value.type.name && (
                  <Badge className="ml-2 font-mono" variant="muted">
                    {value.type.name}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
