"use client";

import { cn } from "@/app/utils/cn";
import { PaperclipIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

function validate(data: string) {
  const trimmedData = data.trim().toLowerCase();
  const jsonPattern = /"swagger"\s*:\s*"2\.0"/;
  const yamlPattern = /swagger\s*:\s*["']?2\.0["']?/;
  if (jsonPattern.test(trimmedData)) {
    return "We currently don't support Swagger 2.0 YAML Specification";
  }

  if (yamlPattern.test(trimmedData)) {
    return "We currently don't support Swagger 2.0 YAML Specification";
  }

  return null;
}

const uploadFile = (file: Blob | File) => {
  return new Promise((res, rej) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const schema = e.target?.result;

      if (typeof schema !== "string") {
        rej("Failed to read the file");
        return;
      }

      const validationError = validate(schema);
      if (validationError) {
        rej(validationError);
        return;
      }

      const createBin = await fetch("https://api.mockbin.io/v1/bins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          response: {
            status: 200,
            body: e.target?.result,
            headers: {
              "Content-Type": schema.trim().startsWith("{")
                ? "application/json"
                : "application/yml",
            },
          },
        }),
      });

      const bin = (await createBin.json()) as {
        id: string;
        url: string;
      };

      if ("url" in bin ? bin.url : null) {
        window.open(`/demo?api-url=${encodeURIComponent(bin.url.trim())}`);
        res(`/demo?api-url=${encodeURIComponent(bin.url.trim())}`);
      }
    };

    reader.readAsText(file);
  });
};

export const PreviewInput = ({ sample }: { sample: string }) => {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles.at(0);
    if (file) {
      try {
        await uploadFile(file);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not upload file");
      }
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    if (formRef.current && error) {
      formRef.current.reset();
    }
  }, [error]);

  return (
    <div {...getRootProps()}>
      <div
        className={cn(
          "absolute top-0 left-0 w-full h-full pointer-events-none",
          isDragActive &&
            "rounded-3xl bg-white/5 border border-dashed border-white/10",
        )}
        onClick={(e) => {
          e.preventDefault();
        }}
      />
      {error && <div className=" p-2 bg-white/5 rounded mb-4">{error}</div>}
      <form
        ref={formRef}
        className={cn(
          "justify-center items-center gap-x-3 sm:flex rounded-xl border border-transparent",
        )}
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (e.target instanceof HTMLFormElement) {
            const formData = new FormData(e.target);
            const url = formData.get("url");
            const spec = formData.get("spec");
            if (spec instanceof Blob && spec.size > 0) {
              try {
                await uploadFile(spec);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Could not upload file",
                );
              }
            } else {
              const schema =
                typeof url === "string" && url.trim().length > 0
                  ? url.trim()
                  : sample;

              window.open(`/demo?api-url=${schema}`);
            }

            e.preventDefault();

            if (typeof window !== "undefined") {
              window.gtag?.("event", "conversion", {
                send_to: "AW-11213523037/r09MCL3Wv9UZEN2Qg-Mp",
                value: 1.0,
                currency: "USD",
              });
            }
          }
        }}
      >
        <label
          className={cn(
            "hidden md:block rounded transition hover:scale-125 cursor-pointer",
          )}
        >
          <input
            type="file"
            name="spec"
            className="hidden"
            onChange={(e) => {
              e.preventDefault();
              if (formRef.current) {
                formRef.current.dispatchEvent(
                  new Event("submit", { bubbles: true, cancelable: true }),
                );
              }
            }}
            {...getInputProps()}
          />
          <PaperclipIcon />
        </label>
        <input
          name="url"
          type="url"
          placeholder={sample}
          className="w-full px-4 py-3.5 text-white bg-slate-700 outline-none rounded-lg shadow font-medium text-md"
        />
        <button
          type="submit"
          className="whitespace-nowrap flex items-center justify-center gap-x-2 py-4 px-4 mt-3 w-full text-sm text-white font-medium bg-[#ff00bd] hover:bg-[#ff00bd]/80 active:bg-[#ff00bd]/80 duration-150 rounded-lg sm:mt-0 sm:w-auto"
        >
          Try it out
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M2 10a.75.75 0 01.75-.75h12.59l-2.1-1.95a.75.75 0 111.02-1.1l3.5 3.25a.75.75 0 010 1.1l-3.5 3.25a.75.75 0 11-1.02-1.1l2.1-1.95H2.75A.75.75 0 012 10z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </form>
    </div>
  );
};
