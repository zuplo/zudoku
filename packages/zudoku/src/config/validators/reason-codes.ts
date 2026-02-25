export const REASON_CODES = {
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
} as const;

export type ReasonCode = (typeof REASON_CODES)[keyof typeof REASON_CODES];
export type ProtectedRouteResult = boolean | ReasonCode;
