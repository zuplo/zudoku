import type { SVGProps } from "react";

const CIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <title>C</title>
    <path
      fill="#A8B9CC"
      d="M16.592 9.196s-.354-3.298-3.627-3.39c-3.274-.09-4.955 2.474-4.955 6.14 0 3.665 1.858 6.597 5.045 6.597 3.184 0 3.538-3.298 3.538-3.298l6.104.365s.36 3.557-3.443 3.557c-3.802 0-5.953-3.729-5.953-7.224 0-3.494 2.151-7.224 5.953-7.224 3.802 0 3.443 3.557 3.443 3.557l-6.104.365z"
    />
  </svg>
);

export default CIcon;
