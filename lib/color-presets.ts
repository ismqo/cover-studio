export type BasicColorName = "blue" | "purple" | "pink" | "red" | "orange" | "yellow" | "green" | "graphite" | "white" | "black";

/** macOS-style accent colors, plus white and black for text. */
export const BASIC_COLORS: readonly (readonly [BasicColorName, string])[] = [
  ["blue", "#0a84ff"],
  ["purple", "#a550a7"],
  ["pink", "#f74f9e"],
  ["red", "#ff5257"],
  ["orange", "#f7821b"],
  ["yellow", "#ffc600"],
  ["green", "#62ba46"],
  ["graphite", "#8c8c8c"],
  ["white", "#ffffff"],
  ["black", "#111111"],
];

/** Returns the preset matching a color value (case-insensitive), or null when it is a custom color. */
export function findPreset(value: string, presets: readonly string[]) {
  return presets.find(hex => hex.toLowerCase() === value.toLowerCase()) ?? null;
}
