export const ROOT_TYPES = {
  QUERY: "query",
  MUTATION: "mutation",
  SUBSCRIPTION: "subscription",
  OBJECT: "object",
  INPUT_OBJECT: "input",
  ENUM: "enum",
  SCALAR: "scalar",
  INTERFACE: "interface",
  UNION: "union",
} as const;

export type RootType = (typeof ROOT_TYPES)[keyof typeof ROOT_TYPES];

export const typeMetadata: Record<
  RootType,
  { label: string; labelSingular: string; colorClass: string }
> = {
  [ROOT_TYPES.QUERY]: {
    label: "Queries",
    labelSingular: "Query",
    colorClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  [ROOT_TYPES.MUTATION]: {
    label: "Mutations",
    labelSingular: "Mutation",
    colorClass: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  },
  [ROOT_TYPES.SUBSCRIPTION]: {
    label: "Subscriptions",
    labelSingular: "Subscription",
    colorClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  },
  [ROOT_TYPES.OBJECT]: {
    label: "Objects",
    labelSingular: "Object",
    colorClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  [ROOT_TYPES.INPUT_OBJECT]: {
    label: "Inputs",
    labelSingular: "Input",
    colorClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  [ROOT_TYPES.ENUM]: {
    label: "Enums",
    labelSingular: "Enum",
    colorClass: "bg-red-500/15 text-red-700 dark:text-red-300",
  },
  [ROOT_TYPES.SCALAR]: {
    label: "Scalars",
    labelSingular: "Scalar",
    colorClass: "bg-lime-500/15 text-lime-700 dark:text-lime-300",
  },
  [ROOT_TYPES.INTERFACE]: {
    label: "Interfaces",
    labelSingular: "Interface",
    colorClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  },
  [ROOT_TYPES.UNION]: {
    label: "Unions",
    labelSingular: "Union",
    colorClass: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  },
};

export const kindToRootType: Record<string, RootType> = {
  OBJECT: ROOT_TYPES.OBJECT,
  INPUT_OBJECT: ROOT_TYPES.INPUT_OBJECT,
  ENUM: ROOT_TYPES.ENUM,
  SCALAR: ROOT_TYPES.SCALAR,
  INTERFACE: ROOT_TYPES.INTERFACE,
  UNION: ROOT_TYPES.UNION,
};
