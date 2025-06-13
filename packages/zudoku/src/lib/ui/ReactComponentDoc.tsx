import { Badge } from "./Badge.js";
import { Card, CardContent } from "./Card.js";

type ReactComponentDocProps = {
  component: {
    __docgenInfo: {
      displayName: string;
      description: string;
      props: Record<
        string,
        {
          type: string;
          description: string;
          required: boolean;
        }
      >;
    };
  };
};

export const ReactComponentDoc = ({ component }: ReactComponentDocProps) => {
  const docgen = component.__docgenInfo;
  return (
    <Card className="not-prose">
      <CardContent className="mt-6">
        <div className="flex flex-col gap-2">
          {Object.entries(docgen.props).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-2">
              <div className="">
                <span className="font-medium text-primary">{key}</span>
                {value.type.name && (
                  <Badge className="ml-2 font-mono" variant="muted">
                    {value.type.name}
                  </Badge>
                )}
                {value.required && (
                  <Badge className="ml-2 font-mono">required</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
