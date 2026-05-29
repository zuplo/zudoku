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
  {
    label: string;
    labelSingular: string;
    description: string;
    colorClass: string;
    textColorClass: string;
  }
> = {
  [ROOT_TYPES.QUERY]: {
    label: "Queries",
    labelSingular: "Query",
    description: "Read data from the API",
    colorClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    textColorClass: "text-sky-700 dark:text-sky-300",
  },
  [ROOT_TYPES.MUTATION]: {
    label: "Mutations",
    labelSingular: "Mutation",
    description: "Create, update, or delete data",
    colorClass: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
    textColorClass: "text-pink-700 dark:text-pink-300",
  },
  [ROOT_TYPES.SUBSCRIPTION]: {
    label: "Subscriptions",
    labelSingular: "Subscription",
    description: "Subscribe to real-time updates",
    colorClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    textColorClass: "text-purple-700 dark:text-purple-300",
  },
  [ROOT_TYPES.OBJECT]: {
    label: "Objects",
    labelSingular: "Object",
    description: "Complex types with fields",
    colorClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    textColorClass: "text-blue-700 dark:text-blue-300",
  },
  [ROOT_TYPES.INPUT_OBJECT]: {
    label: "Inputs",
    labelSingular: "Input",
    description: "Input types for mutations and queries",
    colorClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    textColorClass: "text-amber-700 dark:text-amber-300",
  },
  [ROOT_TYPES.ENUM]: {
    label: "Enums",
    labelSingular: "Enum",
    description: "Sets of predefined values",
    colorClass: "bg-red-500/15 text-red-700 dark:text-red-300",
    textColorClass: "text-red-700 dark:text-red-300",
  },
  [ROOT_TYPES.SCALAR]: {
    label: "Scalars",
    labelSingular: "Scalar",
    description: "Primitive data types",
    colorClass: "bg-lime-500/15 text-lime-700 dark:text-lime-300",
    textColorClass: "text-lime-700 dark:text-lime-300",
  },
  [ROOT_TYPES.INTERFACE]: {
    label: "Interfaces",
    labelSingular: "Interface",
    description: "Abstract types defining common fields",
    colorClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    textColorClass: "text-indigo-700 dark:text-indigo-300",
  },
  [ROOT_TYPES.UNION]: {
    label: "Unions",
    labelSingular: "Union",
    description: "Types that can be one of several object types",
    colorClass: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    textColorClass: "text-orange-700 dark:text-orange-300",
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
