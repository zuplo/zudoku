if (typeof Object.groupBy === "undefined") {
  Object.groupBy = <K extends PropertyKey, T>(
    items: Iterable<T>,
    keySelector: (item: T, index: number) => K,
  ): Partial<Record<K, T[]>> => {
    const result = {} as Record<K, T[]>;
    let index = 0;

    for (const item of items) {
      const key = keySelector(item, index++);

      result[key] ??= [];
      result[key].push(item);
    }
    return result;
  };
}

// Freeze --scrollbar-width when react-remove-scroll locks the body, preventing
// the CSS calc(100vw - 100%) from recalculating to 0 and causing layout shift.
if (typeof window !== "undefined") {
  new MutationObserver(() => {
    const locked = document.body.hasAttribute("data-scroll-locked");
    const gap = locked
      ? getComputedStyle(document.body).getPropertyValue(
          "--removed-body-scroll-bar-size",
        )
      : "";

    if (gap) {
      document.documentElement.style.setProperty("--scrollbar-width", gap);
    } else {
      document.documentElement.style.removeProperty("--scrollbar-width");
    }
  }).observe(document.body, {
    attributes: true,
    attributeFilter: ["data-scroll-locked"],
  });
}

if (typeof window !== "undefined" && !window.requestIdleCallback) {
  window.requestIdleCallback = (cb: IdleRequestCallback) =>
    Number(
      setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1),
    );
  window.cancelIdleCallback = (id: number) => clearTimeout(id);
}
