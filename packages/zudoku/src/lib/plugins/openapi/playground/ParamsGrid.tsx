import createVariantComponent from "../../../util/createVariantComponent.js";

const ParamsGrid = createVariantComponent(
  "div",
  "grid grid-cols-[2fr_3fr] gap-2 items-center",
);

export const ParamsGridItem = createVariantComponent(
  "div",
  "group hover:bg-accent px-3 grid col-span-full grid-cols-subgrid",
);

export default ParamsGrid;
