import type { SVGProps } from "react";

const TomlIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    width="1em"
    height="1em"
    {...props}
  >
    <title>TOML</title>
    <path
      className="dark:fill-[#7f7f7f]"
      d="M22.76 6.83v3.25h-5v15.09h-3.5V10.08h-5V6.83Z"
    />
    <path
      className="fill-[#bfbfbf] dark:fill-[#a2a2a2]"
      d="M2 2h6.2v3.09H5.34v21.8H8.2V30H2ZM30 30h-6.2v-3.09h2.86V5.11H23.8V2H30Z"
    />
  </svg>
);

export default TomlIcon;
