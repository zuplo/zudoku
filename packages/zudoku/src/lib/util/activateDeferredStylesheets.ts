export const activateDeferredStylesheets = () => {
  const links = document.querySelectorAll<HTMLLinkElement>(
    "link[data-zudoku-deferred-stylesheet]",
  );
  if (links.length === 0) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let activated = false;
    let fallbackTimer: number | undefined;

    const activate = () => {
      if (activated) return;
      activated = true;
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      document.removeEventListener("visibilitychange", activateIfHidden);
      links.forEach((link) => {
        link.rel = "stylesheet";
        link.removeAttribute("data-zudoku-deferred-stylesheet");
      });
      resolve();
    };
    const activateIfHidden = () => {
      if (document.visibilityState === "hidden") activate();
    };

    // A hidden page does not paint and its animation frames can be suspended.
    // Activate immediately so background loads and OAuth callback tabs hydrate.
    if (document.visibilityState === "hidden") {
      activate();
      return;
    }

    document.addEventListener("visibilitychange", activateIfHidden);
    fallbackTimer = window.setTimeout(activate, 250);

    // Two frames guarantee the critical stylesheet gets one paint before the
    // complete sheet is activated. Its preload has already started the fetch.
    requestAnimationFrame(() => requestAnimationFrame(activate));
  });
};
