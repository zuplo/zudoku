import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { Heading } from "../../components/Heading.js";
import { useOasConfig } from "./context.js";
import { DownloadSchemaButton } from "./DownloadSchemaButton.js";
import { buildVersionSwitchUrl } from "./util/getRoutes.js";

type ApiHeaderProps = {
  title?: ReactNode;
  heading: ReactNode;
  headingId: string;
  children?: ReactNode;
  tag?: string;
};

export const ApiHeader = ({
  title,
  heading,
  headingId,
  children,
  tag,
}: ApiHeaderProps) => {
  const { input, type, versions, version, options } = useOasConfig();
  const navigate = useNavigate();

  const hasMultipleVersions = Object.keys(versions).length > 1;
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

  const handleVersionChange = (newVersion: string) => {
    const target = versions[newVersion];
    if (!target) return;

    navigate(buildVersionSwitchUrl(target, tag));
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 sm:flex-row justify-around items-start">
        <div className="flex flex-col flex-1 gap-3">
          {title && (
            <CategoryHeading>
              <Link to="..">{title}</Link>
            </CategoryHeading>
          )}
          <Heading level={1} id={headingId} registerNavigationAnchor>
            {heading}
          </Heading>
          {children}
        </div>
        <div className="flex flex-col gap-4 sm:items-end self-start">
          <div className="flex gap-2 items-center">
            {showVersions && (
              <Select
                onValueChange={handleVersionChange}
                value={version}
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
        </div>
      </div>
    </div>
  );
};
