import { useMutation } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { Fragment, useEffect, useRef, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
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
import { useSelectedServerStore } from "../../../authentication/state.js";
import { useApiIdentities } from "../../../components/context/ZudokuContext.js";
import { Spinner } from "../../../components/Spinner.js";
import { Button } from "../../../ui/Button.js";
import { Callout } from "../../../ui/Callout.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/Card.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/Tabs.js";
import { cn } from "../../../util/cn.js";
import { ColorizedParam } from "../ColorizedParam.js";
import { Content } from "../SidecarExamples.js";
import { createUrl } from "./createUrl.js";
import ExamplesDropdown from "./ExamplesDropdown.js";
import { Headers } from "./Headers.js";
import { PathParams } from "./PathParams.js";
import { QueryParams } from "./QueryParams.js";
import { ResponseTab } from "./ResponseTab.js";

export const NO_IDENTITY = "__none";

const statusCodeMap: Record<number, string> = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  500: "Internal Server Error",
};

export type Header = {
  name: string;
  defaultValue?: string;
  defaultActive?: boolean;
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
  }>;
  identity?: string;
};

export type PlaygroundContentProps = {
  server: string;
  servers?: string[];
  url: string;
  method: string;
  headers?: Header[];
  queryParams?: QueryParam[];
  pathParams?: PathParam[];
  defaultBody?: string;
  examples?: Content;
};

export const Playground = ({
  server,
  servers,
  url,
  method,
  headers = [],
  queryParams = [],
  pathParams = [],
  defaultBody = "",
  examples,
}: PlaygroundContentProps) => {
  const { selectedServer, setSelectedServer } = useSelectedServerStore();
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

  const queryMutation = useMutation({
    mutationFn: async (data: PlaygroundForm) => {
      const requestUrl = createUrl(selectedServer ?? server, url, data);
      const start = performance.now();

      const request = new Request(requestUrl, {
        method: method.toUpperCase(),
        headers: Object.fromEntries(
          data.headers
            .filter((h) => h.name && h.active)
            .map((header) => [header.name, header.value]),
        ),
        body: data.body ? data.body : undefined,
      });

      if (data.identity !== NO_IDENTITY) {
        identities.data
          ?.find((i) => i.id === data.identity)
          ?.authorizeRequest(request);
      }
      try {
        const response = await fetch(request, {
          signal: AbortSignal.timeout(5000),
        });

        const time = performance.now() - start;

        const body = await response.text();

        return {
          status: response.status,
          headers: response.headers,
          size: body.length,
          body,
          time,
        };
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

  const path = url.split("/").map((part, i, arr) => {
    const isPathParam =
      (part.startsWith("{") && part.endsWith("}")) || part.startsWith(":");
    const replaced = part.replace(/[:{}]/g, "");
    const value = formState.pathParams.find((p) => p.name === replaced)?.value;

    const pathParamValue = (
      <ColorizedParam
        backgroundOpacity="25%"
        name={part}
        slug={part}
        title={
          !value
            ? `Missing value for path parameter \`${replaced}\``
            : undefined
        }
      >
        {value ? encodeURIComponent(value) : part}
      </ColorizedParam>
    );

    return (
      // eslint-disable-next-line react/no-array-index-key
      <Fragment key={part + i}>
        {isPathParam ? pathParamValue : part}
        {i < arr.length - 1 && "/"}
        <wbr />
      </Fragment>
    );
  });

  const headerEntries = Array.from(queryMutation.data?.headers.entries() ?? []);

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
      {servers && servers.length > 1 ? (
        <Select
          onValueChange={(value) => {
            startTransition(() => {
              setSelectedServer(value);
            });
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
      ) : (
        <span>{server.replace(/^https?:\/\//, "")}</span>
      )}
    </div>
  );

  return (
    <FormProvider
      {...{ register, control, handleSubmit, watch, setValue, ...form }}
    >
      <form onSubmit={handleSubmit((data) => queryMutation.mutateAsync(data))}>
        <div className="grid grid-cols-[8fr_7fr] text-sm h-full">
          <div className="flex flex-col gap-4 p-4 after:bg-muted-foreground/20 relative after:absolute after:w-px after:inset-0 after:left-auto">
            <div className="flex gap-2 items-stretch">
              <div className="flex flex-1 items-center w-full border rounded-md">
                <div className="border-r p-2 bg-muted rounded-l-md self-stretch font-semibold font-mono flex items-center">
                  {method.toUpperCase()}
                </div>
                <div className="flex items-center flex-wrap p-2 font-mono text-xs">
                  {serverSelect}
                  {path}
                  {urlQueryParams.length > 0 ? "?" : ""}
                  {urlQueryParams}
                </div>
              </div>
              <Button type="submit" className="h-auto flex gap-1">
                Send
              </Button>
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
                <Headers control={control} register={register} />
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
          <div className="min-w-0 p-8 bg-muted/70">
            {queryMutation.error ? (
              <div className="flex flex-col gap-2">
                {formState.pathParams.some((p) => p.value === "") && (
                  <Callout type="caution">
                    Some path parameters are missing values. Please fill them in
                    to ensure the request is sent correctly.
                  </Callout>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle>Request failed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    Error:{" "}
                    {queryMutation.error.message ||
                      String(queryMutation.error) ||
                      "Unexpected error"}
                  </CardContent>
                </Card>
              </div>
            ) : queryMutation.data ? (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="flex text-xs gap-6">
                    <div>
                      Status: {queryMutation.data.status}{" "}
                      {statusCodeMap[queryMutation.data.status] ?? ""}
                    </div>
                    <div>Time: {queryMutation.data.time.toFixed(0)}ms</div>
                    <div>Size: {queryMutation.data.size} B</div>
                  </div>
                </div>
                <Tabs defaultValue="response">
                  <TabsList>
                    <TabsTrigger value="response">Response</TabsTrigger>
                    <TabsTrigger value="headers">
                      {headerEntries.length
                        ? `Headers (${headerEntries.length})`
                        : "No headers"}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="response">
                    <ResponseTab
                      headers={queryMutation.data.headers}
                      body={queryMutation.data.body}
                    />
                  </TabsContent>
                  <TabsContent value="headers">
                    <Card
                      // playground dialog has h-5/6 ≈ 83.333vh
                      className="max-h-[calc(83.333vh-140px)] overflow-y-auto grid grid-cols-2 w-full gap-2.5 font-mono text-xs shadow-none p-4"
                    >
                      <div className="font-semibold">Key</div>
                      <div className="font-semibold">Value</div>
                      {headerEntries.map(([key, value]) => (
                        <Fragment key={key}>
                          <div>{key}</div>
                          <div className="break-words">{value}</div>
                        </Fragment>
                      ))}
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="grid place-items-center h-full">
                <span className="text-[16px] font-semibold text-muted-foreground">
                  {queryMutation.isPending ? (
                    <Spinner />
                  ) : (
                    "Send a request first to see the response here"
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default Playground;
