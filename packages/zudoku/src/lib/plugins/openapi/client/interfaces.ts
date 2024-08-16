import { Client } from "urql";

export type CreateClientFunction = (config: {
  useMemoryClient: boolean;
}) => Client;
