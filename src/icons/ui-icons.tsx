import type { SVGProps } from "react";

export type UiIconProps = SVGProps<SVGSVGElement>;

export function ChevronDownIcon(props: UiIconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
