import createVariantComponent from "../../../util/createVariantComponent.js";

const ParamsGrid = createVariantComponent(
  "div",
  "grid grid-cols-[2fr_3fr] items-center",
);

export const ParamsGridItem = createVariantComponent(
  "div",
  "group hover:bg-accent px-4 py-1 grid col-span-full grid-cols-subgrid",
);

export default ParamsGrid;
