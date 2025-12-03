import type { SVGProps } from 'react';

export function FistIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.26 20.74 12 22.99a2.05 2.05 0 0 1-2.92 0l-1.06-1.06a2.05 2.05 0 0 1 0-2.92l1.06-1.06c.24-.24.58-.39.94-.39h.01c.36 0 .7.15.94.39l.71.71" />
      <path d="m11.29 17.71 2.12-2.12" />
      <path d="M8.41 16.33 12 12.74l.71-.71a2.05 2.05 0 0 0 0-2.92l-1.06-1.06a2.05 2.05 0 0 0-2.92 0L6.67 9.12" />
      <path d="m7.39 9.84 2.12 2.12" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
