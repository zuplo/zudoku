import { Card } from "zudoku/ui/Card.js";
import createVariantComponent from "../../util/createVariantComponent.js";

export const AuthCard = createVariantComponent(
  Card,
  "max-w-md w-full mt-10 mx-auto",
);
