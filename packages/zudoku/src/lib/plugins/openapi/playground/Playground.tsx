import { useNProgress } from "@tanem/react-nprogress";
import { useMutation } from "@tanstack/react-query";
import { LockIcon, Unlink2Icon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "zudoku/ui/Button.js";
import { Collapsible, CollapsibleContent } from "zudoku/ui/Collapsible.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { TooltipProvider } from "zudoku/ui/Tooltip.js";
import { useApiIdentities } from "../../../components/context/ZudokuContext.js";
import { useLatest } from "../../../util/useLatest.js";
import { type Content } from "../SidecarExamples.js";
import { useSelectedServer } from "../state.js";
import BodyPanel from "./BodyPanel.js";
import {
  CollapsibleHeader,
  CollapsibleHeaderTrigger,
} from "./CollapsibleHeader.js";
import { createUrl } from "./createUrl.js";
import { extractFileName, isBinaryContentType } from "./fileUtils.js";
import { Headers } from "./Headers.js";
import { IdentityDialog } from "./IdentityDialog.js";
import IdentitySelector from "./IdentitySelector.js";
import { PathParams } from "./PathParams.js";
import { QueryParams } from "./QueryParams.js";
import { useIdentityStore } from "./rememberedIdentity.js";
import { UrlPath } from "./request-panel/UrlPath.js";
import { UrlQueryParams } from "./request-panel/UrlQueryParams.js";
import RequestLoginDialog from "./RequestLoginDialog.js";
import { ResultPanel } from "./result-panel/ResultPanel.js";
import { useRememberSkipLoginDialog } from "./useRememberSkipLoginDialog.js";

export const NO_IDENTITY = "__none";

export type Header = {
  name: string;
  defaultValue?: string;
  defaultActive?: boolean;
  isRequired?: boolean;
  enum?: string[];
  type?: string;
};

export type QueryParam = {
  name: string;
  defaultValue?: string;
  defaultActive?: boolean;
  isRequired?: boolean;
  enum?: string[];
  type?: string;
};

export type PathParam = {
  name: string;
  defaultValue?: string;
  isRequired?: boolean;
};

export type PlaygroundForm = {
  body: string;
  queryParams: Array<{
    name: string;
    value: string;
    active: boolean;
    enum?: string[];
  }>;
  pathParams: Array<{
    name: string;
    value: string;
  }>;
  headers: Array<{
    name: string;
    value: string;
    active: boolean;
    enum?: string[];
  }>;
  identity?: string;
};

export type PlaygroundResult = {
  status: number;
  headers: Array<[string, string]>;
  size: number;
  body: string;
  time: number;
  isBinary?: boolean;
  fileName?: string;
  blob?: Blob;
  request: {
    method: string;
    url: string;
    headers: Array<[string, string]>;
    body?: string;
  };
};

export type PlaygroundContentProps = {
  server?: string;
  servers?: string[];
  url: string;
  method: string;
  headers?: Header[];
  queryParams?: QueryParam[];
  pathParams?: PathParam[];
  defaultBody?: string;
  examples?: Content;
  requiresLogin?: boolean;
  onLogin?: () => void;
  onSignUp?: () => void;
};

export const Playground = ({
  server,
  servers = [],
  url,
  method,
  headers = [],
  queryParams = [],
  pathParams = [],
  defaultBody = "",
  examples,
  requiresLogin = false,
  onLogin,
  onSignUp,
}: PlaygroundContentProps) => {
  const { selectedServer, setSelectedServer } = useSelectedServer(
    servers.map((url) => ({ url })),
  );
  const [showSelectIdentity, setShowSelectIdentity] = useState(false);
  const identities = useApiIdentities();
  const { setRememberedIdentity, getRememberedIdentity } = useIdentityStore();
  const [, startTransition] = useTransition();
  const { skipLogin, setSkipLogin } = useRememberSkipLoginDialog();
  const [showLongRunningWarning, setShowLongRunningWarning] = useState(false);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const latestSetRememberedIdentity = useLatest(setRememberedIdentity);

  const { register, control, handleSubmit, watch, setValue, ...form } =
    useForm<PlaygroundForm>({
      defaultValues: {
        body: defaultBody,
        queryParams:
          queryParams.length > 0
            ? queryParams.map((param) => ({
                name: param.name,
                value: param.defaultValue ?? "",
                active: param.defaultActive ?? false,
                enum: param.enum ?? [],
              }))
            : [
                {
                  name: "",
                  value: "",
                  active: false,
                  enum: [],
                },
              ],
        pathParams: pathParams.map((param) => ({
          name: param.name,
          value: param.defaultValue ?? "",
        })),
        headers:
          headers.length > 0
            ? headers.map((header) => ({
                name: header.name,
                value: header.defaultValue ?? "",
                active: header.defaultActive ?? false,
              }))
            : [
                {
                  name: "",
                  value: "",
                  active: false,
                },
              ],
        identity: getRememberedIdentity([
          NO_IDENTITY,
          ...(identities.data?.map((i) => i.id) ?? []),
        ]),
      },
    });
  const identity = watch("identity");

  const authorizationFields = useMemo(
    () => identities.data?.find((i) => i.id === identity)?.authorizationFields,
    [identities.data, identity],
  );

  useEffect(() => {
    if (identity) {
      latestSetRememberedIdentity.current(identity);
    }
  }, [latestSetRememberedIdentity, identity]);

  const queryMutation = useMutation({
    gcTime: 0,
    mutationFn: async (data: PlaygroundForm) => {
      const start = performance.now();

      const headers = Object.fromEntries([
        ...data.headers
          .filter((h) => h.name && h.active)
          .map((header) => [header.name, header.value]),
      ]);

      const request = new Request(
        createUrl(server ?? selectedServer, url, data),
        {
          method: method.toUpperCase(),
          headers,
          body: data.body ? data.body : undefined,
        },
      );

      if (data.identity !== NO_IDENTITY) {
        await identities.data
          ?.find((i) => i.id === data.identity)
          ?.authorizeRequest(request);
      }

      const warningTimeout = setTimeout(
        () => setShowLongRunningWarning(true),
        3210,
      );
      abortControllerRef.current = new AbortController();

      abortControllerRef.current.signal.addEventListener("abort", () => {
        clearTimeout(warningTimeout);
      });

      try {
        const response = await fetch(request, {
          cache: "no-store",
          signal: abortControllerRef.current.signal,
        });

        clearTimeout(warningTimeout);
        setShowLongRunningWarning(false);

        const time = performance.now() - start;
        const url = new URL(request.url);
        const responseHeaders = Array.from(response.headers.entries());
        const contentType = response.headers.get("content-type") || "";
        const isBinary = isBinaryContentType(contentType);

        let body = "";
        let blob: Blob | undefined;
        let fileName: string | undefined;

        if (isBinary) {
          blob = await response.blob();
          fileName = extractFileName(responseHeaders, request.url);
          body = `Binary content (${contentType})`;
        } else {
          body = await response.text();
        }

        const responseSize = response.headers.get("content-length");

        return {
          status: response.status,
          headers: responseHeaders,
          size: responseSize ? parseInt(responseSize) : body.length,
          body,
          time,
          isBinary,
          fileName,
          blob,
          request: {
            method: request.method.toUpperCase(),
            url: request.url,
            headers: [
              ["Host", url.host],
              ["User-Agent", "Zudoku Playground"],
              ...Array.from(request.headers.entries()),
            ],
            body: data.body ? data.body : undefined,
          },
        } satisfies PlaygroundResult;
      } catch (error) {
        clearTimeout(warningTimeout);
        setShowLongRunningWarning(false);
        if (error instanceof TypeError) {
          throw new Error(
            "The request failed, possibly due to network issues or CORS policy.",
          );
        } else {
          throw error;
        }
      }
    },
  });

  const isRequestAnimating = queryMutation.isPending;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(isRequestAnimating), 100);
    return () => clearTimeout(timer);
  }, [isRequestAnimating]);

  const { isFinished, progress } = useNProgress({ isAnimating });

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const serverSelect = (
    <div className="inline-block opacity-50 hover:opacity-100 transition">
      {server ? (
        <span>{server.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
      ) : (
        servers.length > 1 && (
          <Select
            onValueChange={(value) => {
              startTransition(() => setSelectedServer(value));
            }}
            value={selectedServer}
            defaultValue={selectedServer}
          >
            <SelectTrigger className="p-0 border-none flex-row-reverse bg-transparent text-xs gap-0.5 h-auto translate-y-[4px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {servers.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      )}
    </div>
  );

  const showLogin = requiresLogin && !skipLogin;
  const isBodySupported = ["POST", "PUT", "PATCH", "DELETE"].includes(
    method.toUpperCase(),
  );

  return (
    <FormProvider
      {...{ register, control, handleSubmit, watch, setValue, ...form }}
    >
      <TooltipProvider delayDuration={150}>
        <form
          onSubmit={handleSubmit((data) => {
            if (identities.data?.length === 0 || data.identity) {
              queryMutation.mutate(data);
            } else {
              setShowSelectIdentity(true);
            }
          })}
          className="relative"
        >
          <IdentityDialog
            identities={identities.data ?? []}
            open={showSelectIdentity}
            onOpenChange={setShowSelectIdentity}
            onSubmit={({ rememberedIdentity, identity }) => {
              if (rememberedIdentity) {
                setValue("identity", identity ?? NO_IDENTITY);
              }
              setShowSelectIdentity(false);
              queryMutation.mutate({ ...form.getValues(), identity });
            }}
          />
          <RequestLoginDialog
            open={showLogin}
            setOpen={(open) => setSkipLogin(!open)}
            onSignUp={onSignUp}
            onLogin={onLogin}
          />

          <div className="grid grid-cols-[1fr_1px_1fr] text-sm">
            <div className="col-span-3 p-4 border-b">
              <div className="flex gap-2 items-stretch">
                <div className="flex flex-1 items-center w-full border rounded-md relative overflow-hidden">
                  <div className="border-r p-2 bg-muted rounded-l-md self-stretch font-semibold font-mono flex items-center">
                    {method.toUpperCase()}
                  </div>
                  <div className="items-center px-2 font-mono text-xs break-all leading-6 relative h-full w-full">
                    <div className="h-full py-1.5">
                      {serverSelect}
                      <UrlPath url={url} />
                      <UrlQueryParams />
                    </div>
                    <div
                      className="h-[1px] bg-primary absolute left-0 -bottom-0 z-10 transition-all duration-300 ease-in-out"
                      style={{
                        opacity: isFinished ? 0 : 1,
                        width: isFinished ? 0 : `${progress * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={identities.isLoading || form.formState.isLoading}
                  variant={form.formState.isLoading ? "outline" : "default"}
                  onClick={() => {
                    if (form.formState.isLoading) {
                      abortControllerRef.current?.abort();
                    }
                  }}
                >
                  {form.formState.isLoading ? "Cancel" : "Send"}
                </Button>
              </div>
            </div>
            <div className="relative overflow-y-auto h-[80vh]">
              {identities.data?.length !== 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2">
                    <Collapsible defaultOpen>
                      <CollapsibleHeaderTrigger>
                        <LockIcon size={16} />
                        <CollapsibleHeader>Authentication</CollapsibleHeader>
                      </CollapsibleHeaderTrigger>
                      <CollapsibleContent>
                        <IdentitySelector
                          value={identity}
                          identities={identities.data ?? []}
                          setValue={(value) => setValue("identity", value)}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              )}

              {pathParams.length > 0 && (
                <Collapsible defaultOpen>
                  <CollapsibleHeaderTrigger className="border-t">
                    <Unlink2Icon size={16} />
                    <CollapsibleHeader>Path Parameters</CollapsibleHeader>
                  </CollapsibleHeaderTrigger>
                  <CollapsibleContent>
                    <PathParams url={url} control={control} />
                  </CollapsibleContent>
                </Collapsible>
              )}

              <QueryParams control={control} schemaQueryParams={queryParams} />

              <Headers
                control={control}
                schemaHeaders={headers}
                lockedHeaders={authorizationFields?.headers}
              />
              {isBodySupported && <BodyPanel examples={examples} />}
            </div>
            <div className="w-full bg-muted-foreground/20" />
            <ResultPanel
              queryMutation={queryMutation}
              showLongRunningWarning={showLongRunningWarning}
              onCancel={() => {
                abortControllerRef.current?.abort(
                  "Request cancelled by the user",
                );
                setShowLongRunningWarning(false);
              }}
            />
          </div>
        </form>
      </TooltipProvider>
    </FormProvider>
  );
};

export default Playground;
