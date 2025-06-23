import createVariantComponent from "../../../util/createVariantComponent.js";

const ParamsGrid = createVariantComponent(
  "div",
  "grid grid-cols-[min-content_2fr_3fr] items-center gap-x-5",
);

export const ParamsGridItem = createVariantComponent(
  "div",
  "group h-9 hover:bg-accent/75 ps-4 pe-2 grid col-span-full grid-cols-subgrid items-center border-b",
);

export default ParamsGrid;
