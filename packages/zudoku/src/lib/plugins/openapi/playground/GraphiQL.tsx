import { useMemo } from "react";
import { GraphiQLViewer, type GraphiQLTab } from "../../../graphiql/index.js";
import { useApiIdentitySelection } from "../../../hooks/useApiIdentitySelection.js";
import {
  securitySchemeNamesLabel,
  useIdentityStore,
  valueToIdentitySelection,
} from "../../../hooks/useIdentityStore.js";
import { useLatest } from "../../../util/useLatest.js";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";
import {
  createAuthorizedRequest,
  resolveSelectedRequirement,
  useSecurityCredentialsStore,
} from "./securityCredentialsStore.js";

export type { GraphiQLTab };

type OperationSecurity = OperationsFragmentFragment["security"];

export type GraphiQLPanelProps = {
  endpoint: string;
  defaultTabs?: GraphiQLTab[];
  security?: OperationSecurity;
};

const applySchemeAuth = (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  schemeNames: string[],
  security: OperationSecurity | undefined,
): Request | undefined => {
  const selected = resolveSelectedRequirement(
    security,
    schemeNames,
    useSecurityCredentialsStore.getState().credentials,
  );
  if (!selected) {
    return;
  }

  return createAuthorizedRequest(
    new URL(input instanceof Request ? input.url : input, window.location.href),
    input instanceof Request ? input : init,
    selected,
  );
};

export const GraphiQLPanel = ({
  endpoint,
  defaultTabs,
  security,
}: GraphiQLPanelProps) => {
  const { authorizeRequest, selectedIdentity } = useApiIdentitySelection();
  const rememberedIdentity = useIdentityStore((s) => s.rememberedIdentity);
  const credentials = useSecurityCredentialsStore((s) => s.credentials);
  const latestSecurity = useLatest(security);

  // The footer must only claim auth that `fetchFn` will actually apply, so
  // the scheme label uses the same guards as `applySchemeAuth`.
  const selection = valueToIdentitySelection(rememberedIdentity);
  const schemeLabel =
    selection.type === "scheme" &&
    resolveSelectedRequirement(security, selection.names, credentials)
      ? securitySchemeNamesLabel(selection.names)
      : undefined;
  const authLabel = schemeLabel ?? selectedIdentity?.label;

  // The selection is read at request time so a change takes effect without
  // recreating the fetcher. Security schemes are handled here; API identities
  // go through `authorizeRequest`.
  const fetchFn = useMemo<typeof fetch>(
    () => async (input, init) => {
      const selection = valueToIdentitySelection(
        useIdentityStore.getState().rememberedIdentity,
      );

      if (selection.type === "scheme") {
        const request = applySchemeAuth(
          input,
          init,
          selection.names,
          latestSecurity.current,
        );
        return request ? fetch(request) : fetch(input, init);
      }

      return fetch(await authorizeRequest(new Request(input, init)));
    },
    [authorizeRequest, latestSecurity],
  );

  return (
    <GraphiQLViewer
      endpoint={endpoint}
      fetchFn={fetchFn}
      footerNote={
        authLabel
          ? `Authorized as “${authLabel}”. Auth is applied automatically when the request is sent.`
          : undefined
      }
      defaultTabs={defaultTabs}
      className="h-full w-full"
    />
  );
};

export default GraphiQLPanel;
