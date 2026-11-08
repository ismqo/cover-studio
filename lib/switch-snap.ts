/** Snap to the nearest option, resolving an exact midpoint toward the starting option. */
export function snapSegment(startIndex: number, delta: number, count: number): number {
  const position = startIndex + delta;
  const nearest = delta >= 0 ? Math.ceil(position - .5) : Math.floor(position + .5);
  return Math.max(0, Math.min(count - 1, nearest));
}
