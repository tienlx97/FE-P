/**
 * Upload glyph (Feather icon set, MIT licensed) — used for "upload a file"
 * actions. Not one of Astryx's built-in semantic icon names, hence a local
 * SVG like `icon-plus.jsx`/`icon-refresh.jsx`.
 * @param {import('react').SVGProps<SVGSVGElement>} props
 */
export function IconUpload(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
