import type { SVGProps } from "react";

const ElixirIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <title>Elixir</title>
    <path
      fill="#4B275F"
      d="M19.712 4.008C17.498 2.814 14.985 2.25 12.25 2.25c-2.735 0-5.248.564-7.462 1.758C2.574 5.202 1.5 6.985 1.5 9c0 2.015 1.074 3.798 3.288 4.992C7.002 15.186 9.515 15.75 12.25 15.75c2.735 0 5.248-.564 7.462-1.758C21.926 12.798 23 11.015 23 9c0-2.015-1.074-3.798-3.288-4.992zM12.25 14.25c-2.4 0-4.6-.5-6.5-1.4C4.85 11.95 4 10.55 4 9s.85-2.95 1.75-3.85C7.65 4.25 9.85 3.75 12.25 3.75s4.6.5 6.5 1.4c.9.9 1.75 2.3 1.75 3.85s-.85 2.95-1.75 3.85c-1.9.9-4.1 1.4-6.5 1.4z"
    />
    <circle cx="8" cy="9" r="1.5" fill="#4B275F" />
    <circle cx="16" cy="9" r="1.5" fill="#4B275F" />
  </svg>
);

export default ElixirIcon;
