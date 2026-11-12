import { useId } from "react";

/** A four-point sparkle centered at (x, y), with its points `r` away from the center. */
function sparkle(x: number, y: number, r: number) {
  const k = r * .18;
  return `M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z`;
}

/** The cover's corners (top-left, top-right, bottom-right, bottom-left): a square turned 55° away to the right and rolled 12°,
 *  projected with perspective, so its near (left) edge is taller than its far (right) edge. */
const COVER = "M6.9 0.7L21.8 5.5L25.1 20.9L13.5 31.3Z";

/** Maps the cover's own unit square (-.5 to .5 on both axes) onto its tilted face: the columns are the vectors between
 *  the midpoints of opposite edges, and the translation is the face's center. An affine fit, close enough at this size. */
const FACE = "matrix(13.25 -2.8 4.95 23 16.825 14.6)";

/** Brand mark: an album cover with a music note, tilted in perspective, with a sparkle on two opposite corners. Sparkles use the text color. */
export function BrandMark({ className = "" }: { className?: string }) {
  const id = useId();
  return <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-cover`} x1="0" y1="0" x2="1" y2=".4">
        {/* Lighter on the near edge, darker on the far edge, to sell the depth. */}
        <stop offset="0" stopColor="#ff6577"/>
        <stop offset="1" stopColor="#c8102e"/>
      </linearGradient>
    </defs>
    {/* A same-color round-joined stroke rounds the corners; the faint white line is the inner edge. */}
    <path d={COVER} fill={`url(#${id}-cover)`} stroke={`url(#${id}-cover)`} strokeWidth="3" strokeLinejoin="round"/>
    <path d={COVER} fill="none" stroke="#fff" strokeOpacity=".35" strokeLinejoin="round"/>
    {/* A pair of beamed notes printed on the cover, drawn in a 24-unit box centered on the face. */}
    <g transform={`${FACE} scale(.026) translate(-12 -11.5)`} fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3" fill="#fff"/>
      <circle cx="18" cy="16" r="3" fill="#fff"/>
    </g>
    {/* The cover's top-right and bottom-left corners. */}
    <path d={sparkle(21.8, 5.5, 5)} fill="currentColor"/>
    <path d={sparkle(13.5, 31.3, 4)} fill="currentColor"/>
  </svg>;
}
