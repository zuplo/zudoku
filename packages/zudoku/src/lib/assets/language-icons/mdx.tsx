import type { SVGProps } from "react";

const MdxIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    width="1em"
    height="1em"
    {...props}
  >
    <title>MDX</title>
    <path
      className="fill-foreground"
      d="m20.3 16.5-3.9 3.9-4-3.9 1.1-1.1 2.1 2.1v-5.7h1.5v5.8l2.1-2.1Zm-16.8-.8 2.7 2.7L9 15.7v4.4h1.5V12l-4.3 4.3L2 12v8.1h1.5Z"
    />
    <path
      fill="#f9ac00"
      d="m28.8 20-3.1-3.1-3.1 3.1-1-1.1 3.1-3.1-3.2-3.2 1.1-1 3.1 3.2 3.2-3.2 1.1 1-3.2 3.2 3.1 3.1Z"
    />
  </svg>
);

export default MdxIcon;
