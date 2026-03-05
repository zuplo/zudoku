import type { SVGProps } from "react";

const NpmIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 32 32"
    {...props}
  >
    <path fill="#c12127" d="M2 2h28v28H2" />
    <path fill="#fff" d="M7.25 7.25h17.5v17.5h-3.5v-14H16v14H7.25" />
  </svg>
);
export default NpmIcon;
