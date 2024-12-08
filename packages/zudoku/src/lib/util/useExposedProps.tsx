import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import type { ExposedComponentProps } from "../components/SlotletProvider.js";

export const useExposedProps = (): ExposedComponentProps => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();

  return { location, navigate, params, searchParams, setSearchParams };
};
