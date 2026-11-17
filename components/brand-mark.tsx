/** The cover's corners (top-left, top-right, bottom-right, bottom-left): a square turned 55° away to the right and rolled 12°,
 *  projected with perspective, so its near (left) edge is taller than its far (right) edge. */
const COVER = "M6.9 0.7L21.8 5.5L25.1 20.9L13.5 31.3Z";

/** Maps the cover's own unit square (-.5 to .5 on both axes) onto its tilted face: the columns are the vectors between
 *  the midpoints of opposite edges, and the translation is the face's center. An affine fit, close enough at this size. */
const FACE = "matrix(13.25 -2.8 4.95 23 16.825 14.6)";

/** Brand mark: a flat red album cover with a music note, tilted in perspective. */
export function BrandMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    {/* A same-color round-joined stroke rounds the corners. */}
    <path d={COVER} fill="#fa233b" stroke="#fa233b" strokeWidth="3" strokeLinejoin="round"/>
    {/* A pair of beamed notes printed on the cover, drawn in a 24-unit box centered on the face. */}
    <g transform={`${FACE} scale(.026) translate(-12 -11.5)`} fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3" fill="#fff"/>
      <circle cx="18" cy="16" r="3" fill="#fff"/>
    </g>
  </svg>;
}
