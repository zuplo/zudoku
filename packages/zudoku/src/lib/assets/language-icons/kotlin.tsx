import type { SVGProps } from "react";

const KotlinIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    viewBox="0 0 500 500"
    width="1em"
    height="1em"
    {...props}
  >
    <title>Kotlin</title>
    <linearGradient
      id="a"
      x1={500.003}
      x2={-0.097}
      y1={579.106}
      y2={1079.206}
      gradientTransform="translate(.097 -578.99) scale(.9998)"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset={0.003} stopColor="#e44857" />
      <stop offset={0.469} stopColor="#c711e1" />
      <stop offset={1} stopColor="#7f52ff" />
    </linearGradient>
    <path d="M500 500H0V0h500L250 250z" fill="url(#a)" />
  </svg>
);

export default KotlinIcon;
