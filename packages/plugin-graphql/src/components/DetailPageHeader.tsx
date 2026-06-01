import { Heading, Markdown } from "zudoku/components";
import { Badge } from "zudoku/ui/Badge.js";
import { DeprecatedBadge } from "./Deprecation.js";

export const DetailPageHeader = ({
  name,
  label,
  description,
  isDeprecated,
  deprecationReason,
}: {
  name: string;
  label?: string;
  description?: string | null;
  isDeprecated?: boolean;
  deprecationReason?: string | null;
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-wrap items-baseline gap-3">
      <Heading level={1} className="break-all min-w-0">
        {name}
      </Heading>
      {label && <Badge variant="muted">{label}</Badge>}
    </div>

    {description && (
      <div className="text-muted-foreground max-w-2xl text-pretty">
        <Markdown content={description} />
      </div>
    )}

    {isDeprecated && (
      <div className="flex flex-col gap-2 rounded-lg bg-warning/15 p-3">
        <DeprecatedBadge className="self-start" />
        {deprecationReason && (
          <Markdown className="text-sm [&>p]:m-0" content={deprecationReason} />
        )}
      </div>
    )}
  </div>
);
