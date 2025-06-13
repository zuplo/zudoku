import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./Card.js";

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
    <Card>
      <CardHeader>
        <CardTitle>{docgen.displayName}</CardTitle>
        <CardDescription>{docgen.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          {Object.entries(docgen.props).map(([key, value]) => (
            <div key={key} className="flex flex-row gap-2">
              <div className="w-1/2">
                {key} {value.required && "(required)"}
              </div>
              <div className="w-1/2">{JSON.stringify(value.type)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
