import { useNProgress } from "@tanem/react-nprogress";
import { useMutation } from "@tanstack/react-query";
import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "zudoku/ui/Button.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { useApiIdentities } from "../../../components/context/ZudokuContext.js";
import { PathRenderer } from "../../../components/PathRenderer.js";
import { useLatest } from "../../../util/useLatest.js";
import { ColorizedParam } from "../ColorizedParam.js";
import { type Content } from "../SidecarExamples.js";
import { useSelectedServer } from "../state.js";
import BodyPanel from "./BodyPanel.js";
import { createUrl } from "./createUrl.js";
import { extractFileName, isBinaryContentType } from "./fileUtils.js";
import { Headers } from "./Headers.js";
import { IdentityDialog } from "./IdentityDialog.js";
import IdentitySelector from "./IdentitySelector.js";
import { PathParams } from "./PathParams.js";
import { QueryParams } from "./QueryParams.js";
import { useIdentityStore } from "./rememberedIdentity.js";
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
  const formState = watch();

  useEffect(() => {
    if (formState.identity) {
      latestSetRememberedIdentity.current(formState.identity);
    }
  }, [latestSetRememberedIdentity, formState.identity]);

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

  const path = (
    <PathRenderer
      path={url}
      renderParam={({ name, originalValue, index }) => {
        const formValue = formState.pathParams.find(
          (param) => param.name === name,
        )?.value;

        return (
          <ColorizedParam
            name={name}
            backgroundOpacity="0"
            slug={name}
            onClick={() => form.setFocus(`pathParams.${index}.value`)}
          >
            {formValue || originalValue}
          </ColorizedParam>
        );
      }}
    />
  );

  const urlQueryParams = formState.queryParams
    .filter((p) => p.active)
    .map((p, i, arr) => (
      <Fragment key={p.name}>
        {p.name}={encodeURIComponent(p.value).replaceAll("%20", "+")}
        {i < arr.length - 1 && "&"}
        <wbr />
      </Fragment>
    ));

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
            queryMutation.mutate({ ...formState, identity });
          }}
        />
        <RequestLoginDialog
          open={showLogin}
          setOpen={(open) => setSkipLogin(!open)}
          onSignUp={onSignUp}
          onLogin={onLogin}
        />

        <div className="grid grid-cols-[1fr_min-content_1fr] text-sm">
          <div className="col-span-3 p-4 border-b">
            <div className="flex gap-2 items-stretch">
              <div className="flex flex-1 items-center w-full border rounded-md relative overflow-hidden">
                <div className="border-r p-2 bg-muted rounded-l-md self-stretch font-semibold font-mono flex items-center">
                  {method.toUpperCase()}
                </div>
                <div className="items-center px-2 font-mono text-xs break-all leading-6 relative h-full w-full">
                  <div className="h-full py-1.5">
                    {serverSelect}
                    {path}
                    {urlQueryParams.length > 0 ? "?" : ""}
                    {urlQueryParams}
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
                disabled={identities.isLoading || form.formState.isSubmitting}
              >
                Send
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-5 p-4 after:bg-muted-foreground/20 relative  overflow-y-auto h-[80vh]">
            {identities.data?.length !== 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <span className="font-semibold">Authentication</span>
                  <IdentitySelector
                    value={formState.identity}
                    identities={identities.data ?? []}
                    setValue={(value) => setValue("identity", value)}
                  />
                </div>
              </div>
            )}

            {pathParams.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="font-semibold">Path Parameters</span>
                <PathParams url={url} control={control} />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="font-semibold">Query Parameters</span>
              <QueryParams control={control} queryParams={queryParams} />
            </div>

            <Headers control={control} headers={headers} />
            {isBodySupported && <BodyPanel examples={examples} />}
          </div>
          <div className="w-px bg-muted-foreground/20" />
          <ResultPanel
            queryMutation={queryMutation}
            showPathParamsWarning={formState.pathParams.some(
              (p) => p.value === "",
            )}
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
    </FormProvider>
  );
};

export default Playground;
