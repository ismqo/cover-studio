export function previewTilt(dx: number, dy: number, width: number, height: number) {
  const clamp = (value: number) => Math.max(-12, Math.min(12, value)) || 0;
  return { x: clamp(-dy / height * 12), y: clamp(dx / width * 12) };
}
