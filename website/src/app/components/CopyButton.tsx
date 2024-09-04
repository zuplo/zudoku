"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

export const CopyButton = ({
  textToCopy,
  className,
}: {
  textToCopy: string;
  className?: string;
}) => {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <button
      className={"text-gray-300 hover:text-gray-100 " + className}
      title="Copy code"
      onClick={() => {
        navigator.clipboard
          .writeText(textToCopy)
          .then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
          })
          .catch(() => setIsCopied(false));
      }}
    >
      {isCopied ? (
        <CheckIcon className="text-green-600" size={18} />
      ) : (
        <CopyIcon size={18} />
      )}
    </button>
  );
};
