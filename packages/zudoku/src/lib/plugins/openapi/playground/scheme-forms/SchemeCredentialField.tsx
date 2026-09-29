import { type ReactNode, useId } from "react";
import { Input } from "zudoku/ui/Input.js";
import { Label } from "zudoku/ui/Label.js";
import type {
  BasicCredentials,
  SecurityCredentialValue,
} from "../securityCredentialsStore.js";
import type { SecuritySchemeData } from "./types.js";

const SecretField = ({
  label,
  placeholder,
  value,
  onChange,
  children,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  children?: ReactNode;
}) => {
  const inputId = useId();
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          type="password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        {children}
      </div>
    </div>
  );
};

const BasicCredentialsField = ({
  value,
  onChange,
  children,
}: {
  value: BasicCredentials;
  onChange: (value: BasicCredentials) => void;
  children?: ReactNode;
}) => {
  const usernameId = useId();
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={usernameId} className="text-xs text-muted-foreground">
        HTTP Basic
      </Label>
      <Input
        id={usernameId}
        placeholder="Username"
        value={value.username}
        onChange={(e) => onChange({ ...value, username: e.target.value })}
      />
      <div className="flex gap-2">
        <Input
          type="password"
          aria-label="Password"
          placeholder="Password"
          value={value.password}
          onChange={(e) => onChange({ ...value, password: e.target.value })}
          className="flex-1"
        />
        {children}
      </div>
    </div>
  );
};

const EMPTY_BASIC_CREDENTIALS: BasicCredentials = {
  username: "",
  password: "",
};

const toText = (value: SecurityCredentialValue | undefined) =>
  typeof value === "string" ? value : "";

const toBasicCredentials = (value: SecurityCredentialValue | undefined) =>
  typeof value === "object" ? value : EMPTY_BASIC_CREDENTIALS;

const httpScheme = (scheme: SecuritySchemeData) =>
  scheme.type === "http" ? scheme.scheme?.toLowerCase() : undefined;

export const isCredentialComplete = (
  scheme: SecuritySchemeData,
  value: SecurityCredentialValue | undefined,
) => {
  if (scheme.type === "apiKey") {
    return scheme.in !== "cookie" && toText(value) !== "";
  }
  if (httpScheme(scheme) === "bearer") {
    return toText(value) !== "";
  }
  if (httpScheme(scheme) === "basic") {
    return toBasicCredentials(value).username !== "";
  }
  return false;
};

// `children` renders beside the last input, e.g. an inline Authorize button.
export const SchemeCredentialField = ({
  scheme,
  value,
  onChange,
  children,
}: {
  scheme: SecuritySchemeData;
  value: SecurityCredentialValue | undefined;
  onChange: (value: SecurityCredentialValue) => void;
  children?: ReactNode;
}) => {
  switch (scheme.type) {
    case "apiKey":
      if (scheme.in === "cookie") {
        return (
          <p className="text-xs text-muted-foreground italic">
            Cookie-based API key authentication is not supported in the browser
            playground due to fetch API restrictions.
          </p>
        );
      }
      return (
        <SecretField
          label={`${scheme.paramName ?? "API Key"} (${scheme.in ?? "header"})`}
          placeholder={`Enter ${scheme.paramName ?? "API key"}`}
          value={toText(value)}
          onChange={onChange}
        >
          {children}
        </SecretField>
      );
    case "http":
      if (httpScheme(scheme) === "basic") {
        return (
          <BasicCredentialsField
            value={toBasicCredentials(value)}
            onChange={onChange}
          >
            {children}
          </BasicCredentialsField>
        );
      }
      if (httpScheme(scheme) === "bearer") {
        return (
          <SecretField
            label={`Bearer${scheme.bearerFormat ? ` (${scheme.bearerFormat})` : ""}`}
            placeholder="Enter bearer token"
            value={toText(value)}
            onChange={onChange}
          >
            {children}
          </SecretField>
        );
      }
      return (
        <p className="text-xs text-muted-foreground italic">
          HTTP {scheme.scheme} authentication is not supported in the
          playground. Configure it via custom headers.
        </p>
      );
    case "oauth2":
    case "openIdConnect":
      return (
        <p className="text-xs text-muted-foreground">
          {scheme.type === "oauth2" ? "OAuth 2.0" : "OpenID Connect"} requires a
          Zudoku authentication provider.{" "}
          <a
            href="https://zudoku.dev/docs/configuration/oauth-security-schemes"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Learn how to configure it
          </a>
        </p>
      );
    case "mutualTLS":
      return (
        <p className="text-xs text-muted-foreground italic">
          Mutual TLS is configured at the transport level.
        </p>
      );
    default: {
      const _unhandledScheme: never = scheme;
      return null;
    }
  }
};
