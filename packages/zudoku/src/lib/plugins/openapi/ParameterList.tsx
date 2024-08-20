import { Heading } from "../../components/Heading.js";
import { Card } from "../../ui/Card.js";
import type { ParameterGroup } from "./OperationListItem.js";
import {
  ParameterListItem,
  type ParameterListItemResult,
} from "./ParameterListItem.js";

export const ParameterList = ({
  group,
  parameters,
  id,
}: {
  group: ParameterGroup;
  parameters: ParameterListItemResult[];
  id: string;
}) => (
  <>
    <Heading level={3} id={`${id}/${group}-parameters`} className="capitalize">
      {group === "header" ? "Headers" : `${group} Parameters`}
    </Heading>
    <Card>
      <ul className="list-none m-0 px-0 divide-y ">
        {parameters
          .sort((a, b) => (a.required === b.required ? 0 : a.required ? -1 : 1))
          .map((parameter) => (
            <ParameterListItem
              key={`${parameter.name}-${parameter.in}`}
              parameter={parameter}
              id={id}
              group={group}
            />
          ))}
      </ul>
    </Card>
  </>
);
