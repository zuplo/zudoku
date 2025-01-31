export const scrollIntoViewIfNeeded = (
  element: Element | null,
  options: ScrollIntoViewOptions = { block: "center" },
) => {
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const isInView =
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth);

  if (isInView) return;

  element.scrollIntoView(options);
};
