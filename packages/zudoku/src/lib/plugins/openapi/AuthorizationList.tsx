import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Heading } from "../../components/Heading.js";
import { Card } from "../../ui/Card.js";
import { AuthorizationListItem } from "./AuthorizationListItem.js";
import type { SecurityRequirement } from "./graphql/graphql.js";

export const AuthorizationList = ({
  summary,
  security,
  id,
}: {
  summary?: string;
  security: SecurityRequirement[];
  id: string;
}) => {
  if (!security || security.length === 0) {
    return null;
  }

  return (
    <>
      <Heading level={3} id={`${id}/authorization`}>
        {summary && <VisuallyHidden>{summary} &rsaquo; </VisuallyHidden>}
        Authorization
      </Heading>
      <Card>
        <ul className="list-none m-0 px-0 divide-y">
          {security.map((requirement, index) => (
            <AuthorizationListItem
              key={`${requirement.name}-${index}`}
              requirement={requirement}
            />
          ))}
        </ul>
      </Card>
    </>
  );
};
