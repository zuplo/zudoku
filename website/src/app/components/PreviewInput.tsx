"use client";

import { cn } from "@/app/utils/cn";
import { PaperclipIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

export const PreviewInput = ({ sample }: { sample: string }) => {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (formRef.current && error) {
      formRef.current.reset();
    }
  }, [error]);

  return (
    <>
      {error && <div className=" p-2 bg-white/5 rounded mb-4">{error}</div>}
      <form
        ref={formRef}
        className={cn(
          "justify-center items-center gap-x-3 sm:flex rounded-xl border border-transparent",
          // isDragActive && "bg-white/5 border-dashed border-white/10",
        )}
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (e.target instanceof HTMLFormElement) {
            const formData = new FormData(e.target);
            const url = formData.get("url");
            const spec = formData.get("spec");
            if (spec instanceof Blob && spec.size > 0) {
              const reader = new FileReader();

              reader.onload = async (e) => {
                const schema = e.target?.result;

                if (typeof schema !== "string") {
                  setError("Failed to read the file");
                  return;
                }

                const validationError = validate(schema);

                if (validationError) {
                  setError(validationError);
                  return;
                }

                const createBin = await fetch(
                  "https://api.mockbin.io/v1/bins",
                  {
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
                  },
                );

                const bin = (await createBin.json()) as {
                  id: string;
                  url: string;
                };

                if ("url" in bin ? bin.url : null) {
                  window.open(
                    `/demo?api-url=${encodeURIComponent(bin.url.trim())}`,
                  );
                }
              };

              reader.readAsText(spec);
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
        <label className="hidden md:block rounded transition hover:scale-125 cursor-pointer">
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
    </>
  );
};
