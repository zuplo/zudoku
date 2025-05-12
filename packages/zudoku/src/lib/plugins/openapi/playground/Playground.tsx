import { useMutation } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { PathRenderer } from "../../../components/PathRenderer.js";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { Textarea } from "zudoku/ui/Textarea.js";
import { useApiIdentities } from "../../../components/context/ZudokuContext.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/Tabs.js";
import { cn } from "../../../util/cn.js";
import { objectEntries } from "../../../util/objectEntries.js";
import { useLatest } from "../../../util/useLatest.js";
import { ColorizedParam } from "../ColorizedParam.js";
import { type Content } from "../SidecarExamples.js";
import { useSelectedServer } from "../state.js";
import { createUrl } from "./createUrl.js";
import ExamplesDropdown from "./ExamplesDropdown.js";
import { Headers } from "./Headers.js";
import { IdentityDialog } from "./IdentityDialog.js";
import IdentitySelector from "./IdentitySelector.js";
import { PathParams } from "./PathParams.js";
import { QueryParams } from "./QueryParams.js";
import { useIdentityStore } from "./rememberedIdentity.js";
import RequestLoginDialog from "./RequestLoginDialog.js";
import { ResultPanel } from "./result-panel/ResultPanel.js";
import SubmitButton from "./SubmitButton.js";

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

const bodyContentTypeMap = {
  Plain: "text/plain",
  JSON: "application/json",
  XML: "application/xml",
  YAML: "application/yaml",
  CSV: "text/csv",
} as const;

export type PlaygroundForm = {
  body: string;
  bodyContentType: keyof typeof bodyContentTypeMap;
  queryParams: Array<{
    name: string;
    value: string;
    active: boolean;
    enum?: string[];
  }>;
  pathParams: Array<{ name: string; value: string }>;
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
  const [skipLogin, setSkipLogin] = useState(false);
  const [showLongRunningWarning, setShowLongRunningWarning] = useState(false);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const latestSetRememberedIdentity = useLatest(setRememberedIdentity);

  const { register, control, handleSubmit, watch, setValue, ...form } =
    useForm<PlaygroundForm>({
      defaultValues: {
        body: defaultBody,
        bodyContentType: "JSON",
        queryParams: queryParams
          .map((param) => ({
            name: param.name,
            value: param.defaultValue ?? "",
            active: param.defaultActive ?? false,
            enum: param.enum ?? [],
          }))
          .concat([
            {
              name: "",
              value: "",
              active: false,
              enum: [],
            },
          ]),
        pathParams: pathParams.map((param) => ({
          name: param.name,
          value: param.defaultValue ?? "",
        })),
        headers: headers
          .map((header) => ({
            name: header.name,
            value: header.defaultValue ?? "",
            active: header.defaultActive ?? false,
          }))
          .concat([
            {
              name: "",
              value: "",
              active: false,
            },
          ]),
        identity: getRememberedIdentity(
          identities.data?.map((i) => i.id) ?? [],
        ),
      },
    });
  const formState = watch();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (formState.identity) {
      latestSetRememberedIdentity.current(formState.identity);
    }
  }, [latestSetRememberedIdentity, formState.identity]);

  const queryMutation = useMutation({
    mutationFn: async (data: PlaygroundForm) => {
      const start = performance.now();

      const shouldSetContentType = !data.headers.some(
        (h) => h.active && h.name.toLowerCase() === "content-type",
      );

      const headers = Object.fromEntries([
        ...data.headers
          .filter((h) => h.name && h.active)
          .map((header) => [header.name, header.value]),
        ...(shouldSetContentType
          ? [["content-type", bodyContentTypeMap[data.bodyContentType]]]
          : []),
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
          signal: abortControllerRef.current.signal,
        });

        clearTimeout(warningTimeout);
        setShowLongRunningWarning(false);

        const time = performance.now() - start;
        const body = await response.text();
        const url = new URL(request.url);

        return {
          status: response.status,
          headers: Array.from(response.headers.entries()),
          size: body.length,
          body,
          time,
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
        ref={formRef}
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

        <div className="grid grid-cols-2 text-sm h-full">
          <div className="flex flex-col gap-4 p-4 after:bg-muted-foreground/20 relative after:absolute after:w-px after:inset-0 after:left-auto">
            <div className="flex gap-2 items-stretch">
              <div className="flex flex-1 items-center w-full border rounded-md">
                <div className="border-r p-2 bg-muted rounded-l-md self-stretch font-semibold font-mono flex items-center">
                  {method.toUpperCase()}
                </div>
                <div className="items-center px-2 py-0.5 font-mono text-xs break-all leading-6">
                  {serverSelect}
                  {path}
                  {urlQueryParams.length > 0 ? "?" : ""}
                  {urlQueryParams}
                </div>
              </div>

              <SubmitButton
                identities={identities.data ?? []}
                formRef={formRef}
                disabled={identities.isLoading || form.formState.isSubmitting}
              />
            </div>
            <Tabs defaultValue="parameters">
              <div className="flex flex-wrap gap-1 justify-between">
                <TabsList>
                  <TabsTrigger value="parameters">
                    Parameters
                    {(formState.pathParams.some((p) => p.value !== "") ||
                      formState.queryParams.some((p) => p.active)) && (
                      <div className="w-2 h-2 rounded-full bg-blue-400 ml-2" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="headers">
                    Headers
                    {formState.headers.filter((h) => h.active).length > 0 && (
                      <div className="w-2 h-2 rounded-full bg-blue-400 ml-2" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="auth">
                    Auth
                    {formState.identity !== NO_IDENTITY && (
                      <div className="w-2 h-2 rounded-full bg-blue-400 ml-2" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="body">
                    Body
                    {formState.body && (
                      <div className="w-2 h-2 rounded-full bg-blue-400 ml-2" />
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="headers">
                <Headers control={control} headers={headers} />
              </TabsContent>
              <TabsContent value="parameters">
                {pathParams.length > 0 && (
                  <div className="flex flex-col gap-4 my-4">
                    <span className="font-semibold">Path Parameters</span>
                    <PathParams url={url} control={control} />
                  </div>
                )}
                <div className="flex flex-col gap-4 my-4">
                  <span className="font-semibold">Query Parameters</span>
                  <QueryParams control={control} queryParams={queryParams} />
                </div>
              </TabsContent>
              <TabsContent value="body">
                {!["POST", "PUT", "PATCH", "DELETE"].includes(
                  method.toUpperCase(),
                ) && (
                  <Alert className="mb-2">
                    <InfoIcon className="w-4 h-4" />
                    <AlertTitle>Body</AlertTitle>
                    <AlertDescription>
                      Body is only supported for POST, PUT, PATCH, and DELETE
                      requests
                    </AlertDescription>
                  </Alert>
                )}
                <Textarea
                  {...register("body")}
                  className={cn(
                    "border w-full rounded-lg bg-muted/40 p-2 h-64 font-mono text-[13px]",
                    !isBodySupported && "h-20 bg-muted",
                  )}
                  placeholder={
                    !isBodySupported
                      ? "This request does not support a body"
                      : undefined
                  }
                  disabled={!isBodySupported}
                />
                {isBodySupported && (
                  <div className="flex items-center gap-2 mt-2 justify-between">
                    <Select
                      value={formState.bodyContentType}
                      onValueChange={(value) =>
                        setValue(
                          "bodyContentType",
                          value as keyof typeof bodyContentTypeMap,
                        )
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(bodyContentTypeMap).map((format) => (
                          <SelectItem key={format} value={format}>
                            {format}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {examples && examples.length > 0 && (
                      <ExamplesDropdown
                        examples={examples}
                        onSelect={(example, mediaType) => {
                          setValue(
                            "body",
                            JSON.stringify(example.value, null, 2),
                          );

                          const format = objectEntries(bodyContentTypeMap).find(
                            ([_, contentType]) => contentType === mediaType,
                          )?.[0];

                          if (format) {
                            setValue("bodyContentType", format);
                          }
                        }}
                      />
                    )}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="auth">
                <div className="flex flex-col gap-4 my-4">
                  {identities.data?.length === 0 && (
                    <Alert>
                      <InfoIcon className="w-4 h-4" />
                      <AlertTitle>Authentication</AlertTitle>
                      <AlertDescription>
                        No identities found. Please create an identity first.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex flex-col items-center gap-2">
                    <IdentitySelector
                      value={formState.identity}
                      identities={identities.data ?? []}
                      setValue={(value) => setValue("identity", value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
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
