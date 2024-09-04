import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { InlineCode } from "../../components/InlineCode.js";

export const Endpoint = ({ url }: { url: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <div className="my-4 flex items-center justify-end gap-2 text-sm">
      <span className="font-medium">Endpoint:</span>
      <InlineCode className="p-1.5 flex gap-2.5 items-center text-xs">
        {url}
        <button
          onClick={() => {
            void navigator.clipboard.writeText(url).then(() => {
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            });
          }}
          type="button"
        >
          {isCopied ? (
            <CheckIcon className="text-green-600" size={14} />
          ) : (
            <CopyIcon size={14} strokeWidth={1.3} />
          )}
        </button>
      </InlineCode>
    </div>
  );
};
