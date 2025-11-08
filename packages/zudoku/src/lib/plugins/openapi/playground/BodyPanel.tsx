import {
  ChevronDownIcon,
  FileInput,
  Grid2x2PlusIcon,
  PaperclipIcon,
  ScanTextIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "zudoku/components";
import { Collapsible, CollapsibleContent } from "zudoku/ui/Collapsible.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "zudoku/ui/DropdownMenu.js";
import { Textarea } from "zudoku/ui/Textarea.js";
import { cn } from "../../../util/cn.js";
import { humanFileSize } from "../../../util/humanFileSize.js";
import type { MediaTypeObject } from "../graphql/graphql.js";
import {
  CollapsibleHeader,
  CollapsibleHeaderTrigger,
} from "./CollapsibleHeader.js";
import ExamplesDropdown from "./ExamplesDropdown.js";
import { MultipartField } from "./MultipartField.js";
import ParamsGrid from "./ParamsGrid.js";
import type { PlaygroundForm } from "./Playground.js";

export const BodyPanel = ({ content }: { content?: MediaTypeObject[] }) => {
  const { register, setValue, watch, control } =
    useFormContext<PlaygroundForm>();
  const examples = (content ?? []).flatMap((e) => e.examples);
  const [headers, file, bodyMode, body, multipartFormFields] = watch([
    "headers",
    "file",
    "bodyMode",
    "body",
    "multipartFormFields",
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { fields, append, remove } = useFieldArray<
    PlaygroundForm,
    "multipartFormFields"
  >({ control, name: "multipartFormFields" });

  // Auto-append empty field when user types in the last field
  const handleAutoAppend = () => {
    const lastFieldValue = multipartFormFields?.at(-1);
    if (!lastFieldValue) return;

    if (lastFieldValue.key || lastFieldValue.value) {
      append({ key: "", value: "", active: false }, { shouldFocus: false });
    }
  };

  const handleFileSelect = (selectedFile: File | null) => {
    setValue("file", selectedFile);
    if (!selectedFile) return;
    setValue(
      "headers",
      headers.filter(
        (h) => h.name.toLowerCase() !== "content-type" || !h.active,
      ),
    );
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    handleFileSelect(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0] ?? null;
    handleFileSelect(droppedFile);
  };

  return (
    <Collapsible defaultOpen>
      <CollapsibleHeaderTrigger className="items-center">
        <FileInput size={16} />
        <CollapsibleHeader>Body</CollapsibleHeader>
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-accent hover:brightness-95 gap-2"
              >
                {bodyMode === "text" ? (
                  <>
                    <ScanTextIcon size={14} />
                    Text
                  </>
                ) : bodyMode === "file" ? (
                  <>
                    <PaperclipIcon size={14} />
                    File
                  </>
                ) : (
                  <>
                    <Grid2x2PlusIcon size={14} />
                    Multipart
                  </>
                )}
                <ChevronDownIcon size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-40">
              <DropdownMenuItem
                onSelect={() => setValue("bodyMode", "text")}
                className="gap-2"
              >
                <ScanTextIcon size={14} />
                <span className="flex-1">Text</span>
                <span>
                  {body.length > 0 && (
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  )}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setValue("bodyMode", "file")}
                className="gap-2"
              >
                <PaperclipIcon size={14} />
                <span className="flex-1">File</span>
                <span>
                  {file && (
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  )}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setValue("bodyMode", "multipart")}
                className="gap-2"
              >
                <Grid2x2PlusIcon size={14} strokeWidth={1.5} />
                <span className="flex-1">Multipart</span>
                <span>
                  {multipartFormFields?.some((field) => field.active) && (
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  )}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <div className="w-px h-5 bg-border" />
          {content && examples.length > 0 ? (
            <ExamplesDropdown
              examples={content}
              onSelect={(example, mediaType) => {
                setValue("body", JSON.stringify(example.value, null, 2));
                setValue("headers", [
                  ...headers.filter((h) => h.name !== "Content-Type"),
                  {
                    name: "Content-Type",
                    value: mediaType,
                    active: true,
                  },
                ]);
              }}
            />
          ) : (
            <div />
          )}
        </div>
      </CollapsibleHeaderTrigger>
      <CollapsibleContent className="flex flex-col gap-2">
        {bodyMode === "text" && (
          <Textarea
            {...register("body")}
            className={cn(
              "w-full p-2 h-64 font-mono md:text-xs border-none rounded-none focus-visible:ring-0 transition-colors",
            )}
            placeholder="Body content"
          />
        )}
        {bodyMode === "file" && (
          <div
            role="region"
            aria-label="File upload drop zone"
            className={cn(
              "flex flex-col items-center justify-center gap-4 min-h-[300px]",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex items-center justify-center gap-2 rounded-full size-20 p-0 border border-dashed border-muted-foreground/50 hover:bg-accent/75 transition-colors",
                (file || isDragging) && "border-solid",
                isDragging && "bg-accent border-primary",
              )}
            >
              <PaperclipIcon
                className={cn(
                  "text-muted-foreground",
                  isDragging && "text-primary",
                )}
                size={30}
              />
            </button>
            {file ? (
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border">
                <span className="text-sm truncate" title={file.name}>
                  {file.name}{" "}
                  <span className="text-muted-foreground">
                    ({humanFileSize(file.size)})
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xxs"
                  onClick={() => handleFileSelect(null)}
                >
                  <XIcon size={14} />
                </Button>
              </div>
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                Select or drop a file
              </span>
            )}
          </div>
        )}
        {bodyMode === "multipart" && (
          <ParamsGrid>
            {fields.map((field, index) => (
              <MultipartField
                key={field.id}
                index={index}
                field={field}
                onRemove={() => remove(index)}
                onAutoAppend={handleAutoAppend}
                isLastField={index === fields.length - 1}
              />
            ))}
          </ParamsGrid>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default BodyPanel;
