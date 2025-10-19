import type { SVGProps } from "react";

const DartIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <title>Dart</title>
    <path
      fill="#0175C2"
      d="M4.105 4.105S9.158 1.58 11.684.304a.988.988 0 0 1 1.112.174l9.888 9.888a.988.988 0 0 1 .174 1.112c-1.276 2.526-3.801 7.579-3.801 7.579S15.714 24 12.002 24c-3.713 0-7.897-3.801-7.897-7.897S4.105 4.105 4.105 4.105zm7.897 7.897L12 12l-7.897 7.897c0-3.713 3.801-7.897 7.897-7.897z"
    />
    <path
      fill="#0175C2"
      d="M12.002 0c3.713 0 7.897 3.801 7.897 7.897S15.714 15.714 12.002 15.714c-3.713 0-7.897-3.801-7.897-7.897S8.289 0 12.002 0z"
    />
  </svg>
);

export default DartIcon;
