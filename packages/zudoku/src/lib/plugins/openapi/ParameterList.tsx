import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Fragment } from "react";
import { Heading } from "../../components/Heading.js";
import { Frame, FramePanel } from "../../ui/Frame.js";
import { ItemGroup, ItemSeparator } from "../../ui/Item.js";
import type { OperationsFragmentFragment } from "./graphql/graphql.js";
import type { ParameterGroup } from "./OperationListItem.js";
import {
  ParameterListItem,
  type ParameterListItemData,
} from "./ParameterListItem.js";

export type ParameterItem = NonNullable<
  OperationsFragmentFragment["parameters"]
>[number];

export const ParameterItemList = ({
  parameters,
  group,
  id,
}: {
  parameters: ParameterListItemData[];
  group: ParameterGroup;
  id: string;
}) => {
  const sortedParameters = parameters.sort((a, b) =>
    a.required === b.required ? 0 : a.required ? -1 : 1,
  );

  return (
    <FramePanel className="p-0!">
      <ItemGroup className="overflow-clip">
        {sortedParameters.map((parameter, index) => (
          <Fragment key={parameter.name}>
            {index > 0 && <ItemSeparator />}
            <ParameterListItem parameter={parameter} id={id} group={group} />
          </Fragment>
        ))}
      </ItemGroup>
    </FramePanel>
  );
};

const GROUP_LABELS: Record<ParameterGroup, string> = {
  path: "Path Parameters",
  query: "Query Parameters",
  header: "Headers",
  cookie: "Cookies",
};

export const ParameterList = ({
  summary,
  group,
  parameters,
  id,
}: {
  summary?: string;
  group: ParameterGroup;
  parameters: ParameterItem[];
  id: string;
}) => (
  <div className="flex flex-col gap-3">
    <Heading
      level={4}
      id={`${id}/${group}-parameters`}
      className="text-lg! font-semibold"
    >
      {summary && <VisuallyHidden>{summary} &rsaquo; </VisuallyHidden>}
      {GROUP_LABELS[group]}
    </Heading>
    <Frame>
      <ParameterItemList parameters={parameters} group={group} id={id} />
    </Frame>
  </div>
);
