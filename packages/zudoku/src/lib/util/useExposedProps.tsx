import {
  type Location,
  type NavigateFunction,
  type Params,
  type SetURLSearchParams,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";

export type ExposedComponentProps = {
  location: Location;
  navigate: NavigateFunction;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  params: Params;
};

export const useExposedProps = (): ExposedComponentProps => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();

  return { location, navigate, params, searchParams, setSearchParams };
};
