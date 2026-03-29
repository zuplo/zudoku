import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Fragment } from "react";
import { Heading } from "../../components/Heading.js";
import { useTranslation } from "../../i18n/I18nContext.js";
import { Frame, FramePanel } from "../../ui/Frame.js";
import { ItemGroup, ItemSeparator } from "../../ui/Item.js";
import type { ParameterItem } from "./graphql/graphql.js";
import type { ParameterGroup } from "./OperationListItem.js";
import { ParameterListItem } from "./ParameterListItem.js";

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
}) => {
  const { t } = useTranslation();
  const sortedParameters = parameters.sort((a, b) =>
    a.required === b.required ? 0 : a.required ? -1 : 1,
  );

  return (
    <>
      <Heading
        level={3}
        id={`${id}/${group}-parameters`}
        className="capitalize"
      >
        {summary && <VisuallyHidden>{summary} &rsaquo; </VisuallyHidden>}
        {group === "header"
          ? t("openapi.parameters.headers")
          : t("openapi.parameters.groupParameters", { group })}
      </Heading>
      <Frame>
        <FramePanel className="p-0!">
          <ItemGroup className="overflow-clip">
            {sortedParameters.map((parameter, index) => (
              <Fragment key={`${parameter.name}-${parameter.in}`}>
                {index > 0 && <ItemSeparator />}
                <ParameterListItem
                  parameter={parameter}
                  id={id}
                  group={group}
                />
              </Fragment>
            ))}
          </ItemGroup>
        </FramePanel>
      </Frame>
    </>
  );
};
