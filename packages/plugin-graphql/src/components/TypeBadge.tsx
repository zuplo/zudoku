import type { IntrospectionTypeRef } from "graphql";
import { cn } from "zudoku";
import { Link } from "zudoku/router";
import { useGraphQLSchema } from "../context.js";
import { stringifyType } from "../util/stringifyType.js";
import { kindToRootType, typeMetadata } from "../util/types.js";
import { type TypeWrapper, unwrapType } from "../util/unwrapType.js";

export const TypeBadge = ({ type }: { type: IntrospectionTypeRef }) => {
  const { basePath } = useGraphQLSchema();
  const wrappers: TypeWrapper[] = [];
  const unwrapped = unwrapType(type, wrappers);
  const displayName = stringifyType(unwrapped.name, wrappers);
  const rootType = kindToRootType[unwrapped.kind];
  const meta = rootType ? typeMetadata[rootType] : null;
  const linkPath = rootType
    ? `${basePath}/${rootType}/${unwrapped.name}`
    : null;

  const textClasses = cn(
    "font-mono text-xs",
    meta?.textColorClass ?? "text-muted-foreground",
  );

  return linkPath ? (
    <Link to={linkPath} className={cn(textClasses, "hover:underline")}>
      {displayName}
    </Link>
  ) : (
    <span className={textClasses}>{displayName}</span>
  );
};
