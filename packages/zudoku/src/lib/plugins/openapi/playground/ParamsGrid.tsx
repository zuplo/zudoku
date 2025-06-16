import createVariantComponent from "../../../util/createVariantComponent.js";

const ParamsGrid = createVariantComponent(
  "div",
  "grid grid-cols-[min-content_2fr_3fr] items-center gap-x-4",
);

export const ParamsGridItem = createVariantComponent(
  "div",
  "group h-10 hover:bg-accent px-4 py-1 grid col-span-full grid-cols-subgrid items-center border-b",
);

export default ParamsGrid;
