export interface ApiIdentity {
  authorizeRequest: (request: Request) => Promise<Request> | Request;
  authorizationFields?: {
    headers?: string[];
    queryParams?: string[];
  };
  label: string;
  id: string;
}

export type ExampleItem = {
  description?: string | null;
  externalValue?: string | null;
  name: string;
  summary?: string | null;
  // biome-ignore lint/suspicious/noExplicitAny: JSON value
  value?: any | null;
};

export type EncodingItem = {
  allowReserved?: boolean | null;
  contentType?: string | null;
  explode?: boolean | null;
  headers?: Record<string, unknown> | null;
  name: string;
  style?: string | null;
};

export type MediaTypeObject = {
  encoding?: Array<EncodingItem> | null;
  examples?: Array<ExampleItem> | null;
  mediaType: string;
  // biome-ignore lint/suspicious/noExplicitAny: JSON schema
  schema?: any | null;
};
