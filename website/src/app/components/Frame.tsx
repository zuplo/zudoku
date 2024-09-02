import { clsx } from "clsx";
import type { ReactNode } from "react";

export const Frame = ({
  children,
  className,
  darkMode = true,
  inFocus = true,
  innerPadding = true,
}: {
  children: ReactNode;
  className?: string;
  darkMode?: boolean;
  inFocus?: boolean;
  innerPadding?: boolean;
}) => {
  return (
    <div
      className={clsx(
        darkMode ? "bg-gray-800" : "border-gray-300 bg-white",
        "rounded-lg",
        className,
      )}
    >
      <div
        className={clsx(
          "flex items-center px-3 py-2 rounded-t-lg",
          darkMode ? "bg-gray-700" : "bg-gray-100",
        )}
      >
        <div className="flex space-x-2">
          {["bg-red-500/90", "bg-yellow-500/90", "bg-green-500/90"].map(
            (color) => (
              <span
                key={color}
                className={clsx(
                  "block w-2.5 h-2.5 rounded-full",
                  inFocus ? color : "bg-gray-600",
                )}
              />
            ),
          )}
        </div>
      </div>
      <div
        className={clsx(
          innerPadding && "p-4",
          darkMode ? "text-gray-200" : "text-gray-800",
        )}
      >
        {children}
      </div>
    </div>
  );
};
