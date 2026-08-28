export const getIntrinsicImageDimensions = (
  width: string | number | undefined,
  height: string | number | undefined,
) => {
  if (
    typeof width !== "number" ||
    !Number.isFinite(width) ||
    typeof height !== "number" ||
    !Number.isFinite(height)
  ) {
    return {};
  }

  return { width, height };
};
