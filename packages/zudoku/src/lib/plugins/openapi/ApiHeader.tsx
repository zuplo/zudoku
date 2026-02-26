import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { Heading } from "../../components/Heading.js";
import { Markdown } from "../../components/Markdown.js";
import { useOasConfig } from "./context.js";
import { DownloadSchemaButton } from "./DownloadSchemaButton.js";

type ApiHeaderProps = {
  title: string;
  heading: ReactNode;
  headingId: string;
  description?: string;
  children?: ReactNode;
};

export const ApiHeader = ({
  title,
  heading,
  headingId,
  description,
  children,
}: ApiHeaderProps) => {
  const { input, type, versions, version, options } = useOasConfig();
  const navigate = useNavigate();

  const hasMultipleVersions = Object.entries(versions).length > 1;
  const showVersions =
    options?.showVersionSelect === "always" ||
    (hasMultipleVersions && options?.showVersionSelect !== "hide");

  const currentVersion = version != null ? versions[version] : undefined;
  const downloadUrl =
    typeof input === "string"
      ? type === "url"
        ? input
        : currentVersion?.downloadUrl
      : undefined;

  return (
    <Collapsible className="w-full" defaultOpen={options?.expandApiInformation}>
      <div className="flex flex-col gap-4 sm:flex-row justify-around items-start sm:items-end">
        <div className="flex flex-col flex-1 gap-3">
          <CategoryHeading>{title}</CategoryHeading>
          <Heading level={1} id={headingId} registerNavigationAnchor>
            {heading}
            {showVersions && (
              <span className="text-xl text-muted-foreground ms-1.5">
                {" "}
                ({currentVersion?.label ?? version})
              </span>
            )}
          </Heading>
          {children}
        </div>
        <div className="flex flex-col gap-4 sm:items-end">
          <div className="flex gap-2 items-center">
            {showVersions && (
              <Select
                onValueChange={(v) =>
                  // biome-ignore lint/style/noNonNullAssertion: is guaranteed to be defined
                  navigate(versions[v]!.path)
                }
                defaultValue={version}
                disabled={!hasMultipleVersions}
              >
                <SelectTrigger className="w-[180px]" size="sm">
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(versions).map(([v, { label }]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {options?.schemaDownload?.enabled && downloadUrl && (
              <DownloadSchemaButton downloadUrl={downloadUrl} />
            )}
          </div>
          {description && (
            <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground group">
              <span>API information</span>
              <ChevronsUpDownIcon
                className="group-data-[state=open]:hidden translate-y-px"
                size={14}
              />
              <ChevronsDownUpIcon
                className="group-data-[state=closed]:hidden translate-y-px"
                size={13}
              />
            </CollapsibleTrigger>
          )}
        </div>
      </div>
      {description && (
        <CollapsibleContent className="CollapsibleContent">
          <div className="mt-4 max-w-full border rounded-sm bg-muted/25">
            <Markdown
              className="max-w-full prose-img:max-w-prose border-border p-3 lg:p-5"
              content={description}
            />
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
};
