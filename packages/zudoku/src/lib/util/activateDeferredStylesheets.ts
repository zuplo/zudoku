export const activateDeferredStylesheets = () => {
  // Two frames guarantee the critical stylesheet gets one paint before the
  // complete sheet is activated. Its preload has already started the fetch.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document
        .querySelectorAll<HTMLLinkElement>(
          "link[data-zudoku-deferred-stylesheet]",
        )
        .forEach((link) => {
          link.rel = "stylesheet";
          link.removeAttribute("data-zudoku-deferred-stylesheet");
        });
    });
  });
};
