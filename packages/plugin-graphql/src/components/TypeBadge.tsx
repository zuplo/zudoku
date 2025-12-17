import type { IntrospectionTypeRef } from "graphql";
import { cn } from "zudoku";
import { Link } from "zudoku/router";
import { Badge } from "zudoku/ui/Badge.js";
import { useGraphQLSchema } from "../context.js";
import { stringifyType } from "../util/stringifyType.js";
import { kindToRootType, typeMetadata } from "../util/types.js";
import { type TypeWrapper, unwrapType } from "../util/unwrapType.js";

export const TypeBadge = ({
  type,
  linked = true,
}: {
  type: IntrospectionTypeRef;
  linked?: boolean;
}) => {
  const { basePath } = useGraphQLSchema();
  const wrappers: TypeWrapper[] = [];
  const unwrapped = unwrapType(type, wrappers);
  const displayName = stringifyType(unwrapped.name, wrappers);

  const rootType = kindToRootType[unwrapped.kind];
  const colorClass = rootType
    ? typeMetadata[rootType].colorClass
    : "bg-muted text-muted-foreground";
  const linkPath = rootType
    ? `${basePath}/${rootType}/${unwrapped.name}`
    : null;

  const badge = (
    <Badge className={cn("font-mono text-xs border-0 font-normal", colorClass)}>
      {displayName}
    </Badge>
  );

  if (linked && linkPath) {
    return (
      <Link to={linkPath} className="hover:underline">
        {badge}
      </Link>
    );
  }

  return badge;
};

export const TypeKindBadge = ({ kind }: { kind: string }) => {
  const rootType = kindToRootType[kind];
  const meta = rootType ? typeMetadata[rootType] : null;

  return (
    <Badge
      className={cn(
        "font-mono text-xs border-0",
        meta?.colorClass ?? "bg-muted text-muted-foreground",
      )}
    >
      {meta?.labelSingular ?? kind}
    </Badge>
  );
};
