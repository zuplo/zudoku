import { useMutation } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { Fragment, useEffect, useRef, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { PathRenderer } from "../../../components/PathRenderer.js";

import { Button } from "zudoku/ui/Button.js";
import { Label } from "zudoku/ui/Label.js";
import { RadioGroup, RadioGroupItem } from "zudoku/ui/RadioGroup.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { Textarea } from "zudoku/ui/Textarea.js";
import { useSelectedServer } from "../../../authentication/state.js";
import { useApiIdentities } from "../../../components/context/ZudokuContext.js";
import { Card } from "../../../ui/Card.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/Tabs.js";
import { cn } from "../../../util/cn.js";
import { ColorizedParam } from "../ColorizedParam.js";
import { Content } from "../SidecarExamples.js";
import { createUrl } from "./createUrl.js";
import ExamplesDropdown from "./ExamplesDropdown.js";
import { Headers } from "./Headers.js";
import { PathParams } from "./PathParams.js";
import { QueryParams } from "./QueryParams.js";
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

export type PlaygroundForm = {
  body: string;
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
  const [, startTransition] = useTransition();
  const { register, control, handleSubmit, watch, setValue, ...form } =
    useForm<PlaygroundForm>({
      defaultValues: {
        body: defaultBody,
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
        identity: NO_IDENTITY,
      },
    });
  const formState = watch();
  const identities = useApiIdentities();

  const setOnce = useRef(false);
  useEffect(() => {
    if (setOnce.current) return;
    const firstIdentity = identities.data?.at(0);
    if (firstIdentity) {
      setValue("identity", firstIdentity.id);
      setOnce.current = true;
    }
  }, [setValue, identities.data]);

  const formRef = useRef<HTMLFormElement>(null);

  const queryMutation = useMutation({
    mutationFn: async (data: PlaygroundForm) => {
      const start = performance.now();
      const request = new Request(
        createUrl(server ?? selectedServer, url, data),
        {
          method: method.toUpperCase(),
          headers: Object.fromEntries(
            data.headers
              .filter((h) => h.name && h.active)
              .map((header) => [header.name, header.value]),
          ),
          body: data.body ? data.body : undefined,
        },
      );

      if (data.identity !== NO_IDENTITY) {
        await identities.data
          ?.find((i) => i.id === data.identity)
          ?.authorizeRequest(request);
      }
      try {
        const response = await fetch(request, {
          signal: AbortSignal.timeout(5000),
        });

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
        <span>{server.replace(/^https?:\/\//, "")}</span>
      ) : (
        servers.length > 1 && (
          <Select
            onValueChange={(value) => {
              startTransition(() => setSelectedServer(value));
            }}
            value={selectedServer}
            defaultValue={selectedServer}
          >
            <SelectTrigger className="p-0 border-none flex-row-reverse bg-transparent text-xs gap-0.5 h-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {servers.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/^https?:\/\//, "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      )}
    </div>
  );

  return (
    <FormProvider
      {...{ register, control, handleSubmit, watch, setValue, ...form }}
    >
      <form
        onSubmit={handleSubmit((data) => queryMutation.mutateAsync(data))}
        ref={formRef}
        className="relative"
      >
        {requiresLogin && (
          <div className="absolute top-1/2 right-1/2  -translate-y-1/2 translate-x-1/2 z-50">
            <Alert>
              <AlertTitle className="mb-2">
                Welcome to the Playground
              </AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <div className="mb-2">
                  To use the Playground, you need to login. Please login or
                  signup to continue.
                </div>
                <div className="flex gap-2">
                  {onSignUp && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onSignUp}
                    >
                      Sign Up
                    </Button>
                  )}
                  {onLogin && (
                    <Button type="button" variant="default" onClick={onLogin}>
                      Login
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
        <div
          className={cn(
            "grid grid-cols-2 text-sm h-full",
            requiresLogin && "opacity-30 pointer-events-none",
          )}
        >
          <div className="flex flex-col gap-4 p-4 after:bg-muted-foreground/20 relative after:absolute after:w-px after:inset-0 after:left-auto">
            <div className="flex gap-2 items-stretch">
              <div className="flex flex-1 items-center w-full border rounded-md">
                <div className="border-r p-2 bg-muted rounded-l-md self-stretch font-semibold font-mono flex items-center">
                  {method.toUpperCase()}
                </div>
                <div className="items-center p-2 font-mono text-xs break-words">
                  {serverSelect}
                  {path}
                  {urlQueryParams.length > 0 ? "?" : ""}
                  {urlQueryParams}
                </div>
              </div>

              <SubmitButton
                identities={identities.data ?? []}
                formRef={formRef}
                disabled={form.formState.isSubmitting}
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
                  <TabsTrigger value="body">Body</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="headers">
                <Headers control={control} headers={headers} />
              </TabsContent>
              <TabsContent value="parameters">
                {pathParams.length > 0 && (
                  <div className="flex flex-col gap-4 my-4">
                    <span className="font-semibold">Path Parameters</span>
                    <PathParams control={control} />
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
                    "border w-full rounded-lg p-2 bg-muted h-40 font-mono",
                    !["POST", "PUT", "PATCH", "DELETE"].includes(
                      method.toUpperCase(),
                    ) && "h-20",
                  )}
                  placeholder={
                    !["POST", "PUT", "PATCH", "DELETE"].includes(
                      method.toUpperCase(),
                    )
                      ? "This request does not support a body"
                      : undefined
                  }
                  disabled={
                    !["POST", "PUT", "PATCH", "DELETE"].includes(
                      method.toUpperCase(),
                    )
                  }
                />
                {examples && (
                  <ExamplesDropdown
                    examples={examples}
                    onSelect={(example) =>
                      setValue("body", JSON.stringify(example.value, null, 2))
                    }
                  />
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
                    <Card className="w-full overflow-hidden">
                      <RadioGroup
                        onValueChange={(value) => setValue("identity", value)}
                        value={formState.identity}
                        defaultValue={formState.identity}
                        className="gap-0"
                        disabled={identities.data?.length === 0}
                      >
                        <Label
                          className="h-12 border-b items-center flex p-4 cursor-pointer hover:bg-accent"
                          htmlFor="none"
                        >
                          <RadioGroupItem value={NO_IDENTITY} id="none">
                            None
                          </RadioGroupItem>
                          <Label htmlFor="none" className="ml-2">
                            None
                          </Label>
                        </Label>
                        {identities.data?.map((identity) => (
                          <Label
                            key={identity.id}
                            className="h-12 border-b items-center flex p-4 cursor-pointer hover:bg-accent"
                          >
                            <RadioGroupItem
                              value={identity.id}
                              id={identity.id}
                            >
                              {identity.label}
                            </RadioGroupItem>
                            <Label htmlFor={identity.id} className="ml-2">
                              {identity.label}
                            </Label>
                          </Label>
                        ))}
                      </RadioGroup>
                    </Card>
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
          />
        </div>
      </form>
    </FormProvider>
  );
};

export default Playground;
