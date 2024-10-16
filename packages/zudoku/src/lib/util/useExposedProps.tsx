import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { ExposedComponentProps } from "../components/SlotletProvider.js";

export const useExposedProps = (): ExposedComponentProps => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  return { location, navigate, searchParams, setSearchParams };
};
