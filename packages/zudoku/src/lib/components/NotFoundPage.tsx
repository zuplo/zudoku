import { UnlinkIcon } from "lucide-react";
import { Link, useParams } from "react-router";
import { CategoryHeading } from "./CategoryHeading.js";
import { DeveloperHint } from "./DeveloperHint.js";
import { Heading } from "./Heading.js";
import { Typography } from "./Typography.js";

export const NotFoundPage = () => {
  const params = useParams();

  return (
    <Typography className="h-full pt-(--padding-content-top)">
      <CategoryHeading>404</CategoryHeading>
      <Heading level={1} className="flex gap-3.5 items-center">
        Page not found
        <UnlinkIcon size={24} />
      </Heading>
      <DeveloperHint>
        Start by adding a file at{" "}
        <code>
          {"{DOCUMENT_ROOT}"}/{params["*"]}.mdx
        </code>{" "}
        and add some content to make this error go away. By default{" "}
        <code>DOCUMENT_ROOT</code> is the `pages` directory.
      </DeveloperHint>
      <p>
        It seems that the page you are looking for does not exist or may have
        been moved. Please check the URL for any typos or use the navigation
        menu to find the correct page.
      </p>
      <Link to="/">Go back home</Link>
    </Typography>
  );
};
