import { Badge } from "./Badge.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./Card.js";

type PropType =
  | string
  | { name: string; description: string; required: boolean };

type ReactComponentDocProps = {
  component: {
    __docgenInfo?: {
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
      <CardContent className="p-0">
        <CardHeader className="border-b mb-1 px-4 py-5">
          <CardTitle>Component Properties</CardTitle>
          <CardDescription>The properties of the component.</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 divide-y -mx-4 px-4">
          {Object.entries(docgen.props).map(([key, value]) => (
            <div
              key={key}
              className="px-4 pb-2 col-span-full grid grid-cols-subgrid"
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
      </CardContent>
    </Card>
  );
};
