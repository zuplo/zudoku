import type { SVGProps } from "react";

const HtmlIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    width="1em"
    height="1em"
    viewBox="0 0 32 32"
    {...props}
  >
    <path
      fill="#E44D26"
      d="M27.377 28.889 16.001 32 4.625 28.889 2 0h28.002z"
    />
    <path fill="#FF6C39" d="M16 2v27.75l9.232-2.742L27.688 2z" />
    <path
      fill="#FFF"
      d="M24.363 6H7.607L8 10l.619 7h10.884l-.355 3.984L16 21.99l-3.143-1.006L12.648 19H8.803l.459 4.987L16 25.99l6.728-2.004.99-10.986H12.252l-.25-3H24z"
    />
  </svg>
);

export default HtmlIcon;
