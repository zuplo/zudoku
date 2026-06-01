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
    intro: string;
    docsUrl: string;
    colorClass: string;
    textColorClass: string;
  }
> = {
  [ROOT_TYPES.QUERY]: {
    label: "Queries",
    labelSingular: "Query",
    description: "Read data from the API",
    intro:
      "Queries are read-only operations that fetch data. You request exactly the fields you need, and can traverse related data in a single request.",
    docsUrl: "https://graphql.org/learn/queries/",
    colorClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    textColorClass: "text-sky-700 dark:text-sky-300",
  },
  [ROOT_TYPES.MUTATION]: {
    label: "Mutations",
    labelSingular: "Mutation",
    description: "Create, update, or delete data",
    intro:
      "Mutations modify server-side data. Use them to create, update, or delete records. Each mutation returns the affected data so you can read the result in the same request.",
    docsUrl: "https://graphql.org/learn/mutations/",
    colorClass: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
    textColorClass: "text-pink-700 dark:text-pink-300",
  },
  [ROOT_TYPES.SUBSCRIPTION]: {
    label: "Subscriptions",
    labelSingular: "Subscription",
    description: "Subscribe to real-time updates",
    intro:
      "Subscriptions deliver real-time updates over a long-lived connection. The server pushes data to the client whenever a subscribed event occurs.",
    docsUrl: "https://graphql.org/learn/subscriptions/",
    colorClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    textColorClass: "text-purple-700 dark:text-purple-300",
  },
  [ROOT_TYPES.OBJECT]: {
    label: "Objects",
    labelSingular: "Object",
    description: "Complex types with fields",
    intro:
      "Object types are the building blocks of a schema. Each one defines a set of fields you can query, and fields can return scalars or other object types.",
    docsUrl: "https://graphql.org/learn/schema/#object-types-and-fields",
    colorClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    textColorClass: "text-blue-700 dark:text-blue-300",
  },
  [ROOT_TYPES.INPUT_OBJECT]: {
    label: "Inputs",
    labelSingular: "Input",
    description: "Input types for mutations and queries",
    intro:
      "Input types define structured arguments passed to queries and mutations. They group related fields into a single object, useful for complex inputs.",
    docsUrl: "https://graphql.org/learn/schema/#input-types",
    colorClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    textColorClass: "text-amber-700 dark:text-amber-300",
  },
  [ROOT_TYPES.ENUM]: {
    label: "Enums",
    labelSingular: "Enum",
    description: "Sets of predefined values",
    intro:
      "Enums are a special scalar restricted to a fixed set of allowed values, letting the schema validate that a field or argument is one of a known set.",
    docsUrl: "https://graphql.org/learn/schema/#enumeration-types",
    colorClass: "bg-red-500/15 text-red-700 dark:text-red-300",
    textColorClass: "text-red-700 dark:text-red-300",
  },
  [ROOT_TYPES.SCALAR]: {
    label: "Scalars",
    labelSingular: "Scalar",
    description: "Primitive data types",
    intro:
      "Scalars are the primitive leaf values of a response, such as String, Int, Boolean, or custom scalars. They resolve to concrete data rather than further fields.",
    docsUrl: "https://graphql.org/learn/schema/#scalar-types",
    colorClass: "bg-lime-500/15 text-lime-700 dark:text-lime-300",
    textColorClass: "text-lime-700 dark:text-lime-300",
  },
  [ROOT_TYPES.INTERFACE]: {
    label: "Interfaces",
    labelSingular: "Interface",
    description: "Abstract types defining common fields",
    intro:
      "Interfaces are abstract types that define a set of fields. Object types implementing an interface must include those fields, so you can query across types uniformly.",
    docsUrl: "https://graphql.org/learn/schema/#interfaces",
    colorClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    textColorClass: "text-indigo-700 dark:text-indigo-300",
  },
  [ROOT_TYPES.UNION]: {
    label: "Unions",
    labelSingular: "Union",
    description: "Types that can be one of several object types",
    intro:
      "Unions represent a value that could be one of several object types. Unlike interfaces, the members need not share fields. Use inline fragments to select type-specific fields.",
    docsUrl: "https://graphql.org/learn/schema/#union-types",
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
