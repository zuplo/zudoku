import { useEffect, useRef } from "react";
import { isAppleDevice } from "../util/os.js";

const keymap = {
  other: {
    alt: "Alt",
    meta: "Ctrl",
    ctrl: "Ctrl",
    shift: "⇧",
    option: "Alt",
  },
  apple: {
    alt: "⌥",
    meta: "⌘",
    ctrl: "Ctrl",
    shift: "⇧",
    option: "⌥",
  },
};

export const useHotkey = (hotkey: string, callback: () => void) => {
  const hotkeySanitized = hotkey.toLowerCase().split("+");
  const meta = hotkeySanitized.includes("meta");
  const shift = hotkeySanitized.includes("shift");
  const alt =
    hotkeySanitized.includes("option") || hotkeySanitized.includes("alt");
  const ctrl = hotkeySanitized.includes("ctrl");

  const key = hotkey.split("+").pop();

  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        (event.code === `Key${key?.toUpperCase()}` ||
          event.code.toLowerCase() === key?.toLowerCase()) &&
        event.metaKey === meta &&
        event.shiftKey === shift &&
        event.altKey === alt &&
        event.ctrlKey === ctrl
      ) {
        event.preventDefault();
        callbackRef.current();
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [key, meta, shift, alt, ctrl]);

  return {
    trigger: () => callbackRef.current(),
    label: hotkeySanitized.map((key: string) =>
      key === "meta" ||
      key === "ctrl" ||
      key === "alt" ||
      key === "shift" ||
      key === "option"
        ? keymap[isAppleDevice() ? "apple" : "other"][key]
        : key,
    ),
  };
};
