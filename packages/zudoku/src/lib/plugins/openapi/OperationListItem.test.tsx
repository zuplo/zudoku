// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { OasConfigProvider } from "./context.js";
import type { OperationsFragmentFragment } from "./graphql/graphql.js";
import { makeFragmentData } from "./graphql/index.js";
import type { OasPluginContext } from "./interfaces.js";
import { OperationsFragment } from "./OperationList.js";
import { OperationListItem } from "./OperationListItem.js";

type RequestBodyContent = NonNullable<
  NonNullable<OperationsFragmentFragment["requestBody"]>["content"]
>[number];

const content = (
  mediaType: string,
  schema?: Record<string, unknown>,
): RequestBodyContent => ({
  mediaType,
  schema: schema ?? null,
  encoding: null,
  examples: null,
});

const objectSchema = (property: string) => ({
  type: "object",
  properties: { [property]: { type: "string" } },
});

const operation = (
  requestContent: RequestBodyContent[],
): OperationsFragmentFragment => ({
  slug: "create-shipment-claim",
  summary: "Create a lost shipment claim",
  method: "post",
  description: null,
  operationId: "createShipmentClaim",
  contentTypes: requestContent.map((c) => c.mediaType),
  path: "/shipments/{shipmentId}/claims",
  deprecated: null,
  extensions: {},
  servers: [],
  parameters: null,
  security: null,
  requestBody: { description: null, required: true, content: requestContent },
  responses: [],
});

const config: OasPluginContext = {
  type: "file",
  input: "",
  versions: {},
  options: { disableSidecar: true },
};

const operationElement = (requestContent: RequestBodyContent[]) => (
  <OasConfigProvider value={{ config }}>
    <OperationListItem
      operationFragment={makeFragmentData(
        operation(requestContent),
        OperationsFragment,
      )}
    />
  </OasConfigProvider>
);

const renderOperation = (requestContent: RequestBodyContent[]) =>
  render(operationElement(requestContent));

const requestBodyHeading = () =>
  screen.queryByRole("heading", { level: 3, name: /Request Body/ });

const contentTypeSelect = () =>
  screen.getByRole("combobox", { name: "Request body content type" });

describe("OperationListItem request body", () => {
  it("does not render a content type selector for a single content type", () => {
    renderOperation([
      content("application/json", objectSchema("evidenceUrls")),
    ]);

    expect(requestBodyHeading()).toBeInTheDocument();
    expect(screen.getByText("evidenceUrls")).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Request body content type" }),
    ).not.toBeInTheDocument();
  });

  it("shows the schema of the selected content type", async () => {
    const user = userEvent.setup();
    renderOperation([
      content("multipart/form-data", objectSchema("photos")),
      content("application/json", objectSchema("evidenceUrls")),
    ]);

    expect(contentTypeSelect()).toHaveValue("multipart/form-data");
    expect(screen.getByText("photos")).toBeInTheDocument();
    expect(screen.queryByText("evidenceUrls")).not.toBeInTheDocument();

    await user.selectOptions(contentTypeSelect(), "application/json");

    expect(contentTypeSelect()).toHaveValue("application/json");
    expect(screen.getByText("evidenceUrls")).toBeInTheDocument();
    expect(screen.queryByText("photos")).not.toBeInTheDocument();
  });

  it("keeps the selector when the selected content type has no schema", async () => {
    const user = userEvent.setup();
    renderOperation([
      content("application/json", objectSchema("evidenceUrls")),
      content("application/octet-stream"),
    ]);

    await user.selectOptions(contentTypeSelect(), "application/octet-stream");

    expect(
      screen.getByText("No schema defined for this content type."),
    ).toBeInTheDocument();

    await user.selectOptions(contentTypeSelect(), "application/json");

    expect(screen.getByText("evidenceUrls")).toBeInTheDocument();
  });

  it("falls back to the first content type when the selected one disappears", async () => {
    // e.g. switching API versions re-renders the same item (same slug)
    const user = userEvent.setup();
    const { rerender } = renderOperation([
      content("multipart/form-data", objectSchema("photos")),
      content("application/json", objectSchema("evidenceUrls")),
    ]);

    await user.selectOptions(contentTypeSelect(), "application/json");

    rerender(
      operationElement([
        content("application/merge-patch+json", objectSchema("claimNotes")),
      ]),
    );

    expect(requestBodyHeading()).toBeInTheDocument();
    expect(screen.getByText("claimNotes")).toBeInTheDocument();
  });

  it("hides the request body when its only content type has no schema", () => {
    renderOperation([content("application/octet-stream")]);

    expect(requestBodyHeading()).not.toBeInTheDocument();
  });
});
