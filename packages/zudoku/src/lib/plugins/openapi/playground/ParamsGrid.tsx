import createVariantComponent from "../../../util/createVariantComponent.js";

const ParamsGrid = createVariantComponent(
  "div",
  "hover:bg-accent/40 grid grid-cols-[2fr_3fr] gap-2 items-center px-3",
);

export default ParamsGrid;
