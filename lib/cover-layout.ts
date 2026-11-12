export type CoverMode = "classic" | "essentials" | "similar-artists" | "spotify-this-is" | "spotify-band" | "spotify-photo";
export type Platform = "apple" | "spotify";

export const platformModes: Record<Platform, readonly CoverMode[]> = {
  apple: ["classic", "essentials", "similar-artists"],
  spotify: ["spotify-photo", "spotify-this-is", "spotify-band"],
};

export function platformOf(mode: CoverMode): Platform {
  return mode.startsWith("spotify") ? "spotify" : "apple";
}

/** Settings each style applies when selected, matching the look of its reference cover. */
export function styleDefaults(mode: CoverMode) {
  switch (mode) {
    case "classic": return { textColor: "#ffffff" };
    case "essentials": return { corner: "top-right", textColor: "#111111", treatment: "original" } as const;
    case "similar-artists": return { corner: "top-right", textColor: "#ffffff", treatment: "mono", backgroundType: "custom", customColor: "#3a3836" } as const;
    case "spotify-this-is": return { corner: "top-left", textColor: "#111111", bandColor: "#e0a988" } as const;
    case "spotify-band": return { corner: "top-left", textColor: "#111111", bandColor: "#5aa05a", spotifyTitlePosition: "bottom", spotifyAlign: "left" } as const;
    case "spotify-photo": return { corner: "top-left", textColor: "#ff4632", spotifyTitlePosition: "top", spotifyAlign: "right", treatment: "mono" } as const;
  }
}

type FitOptions = { size: number; minSize: number; maxWidth: number; maxHeight: number; maxLines: number; lineHeight: number };

/** Lines the user broke a title into with Enter; outer breaks are ignored, and breaks beyond `maxLines` join the last line. */
export function titleLines(value: string, maxLines = Infinity) {
  const lines = value.trim().split(/\r?\n/).map(line => line.trim());
  return lines.length > maxLines ? [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(" ")] : lines;
}

/** Line pitch of the Apple Music titles, as a multiple of the font size. */
export const CLASSIC_LINE_HEIGHT = 1.05;

/** Essentials title: one line keeps its spot at the band's bottom; extra lines grow upward and, past the top margin, make the band taller. */
export function essentialsTitleBlock(band: number, fontSize: number, lineCount: number) {
  const extra = (lineCount - 1) * fontSize * CLASSIC_LINE_HEIGHT;
  const top = Math.max(28, band - fontSize - 20) - extra;
  return top >= 28 ? { y: top, band } : { y: 28, band: band + 28 - top };
}

function wrap(value: string, measure: (value: string, size: number) => number, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const word of value.trim().split(/\s+/).filter(Boolean)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && measure(`${last} ${word}`, size) <= maxWidth) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines.length ? lines : [""];
}

/** Wraps each manually broken line on word boundaries. */
function wrapLines(value: string, measure: (value: string, size: number) => number, size: number, maxWidth: number, maxLines: number) {
  return titleLines(value, maxLines).flatMap(line => wrap(line, measure, size, maxWidth));
}

/** Wraps a title on word boundaries, after its manual line breaks, shrinking it only when the lines no longer fit the box. */
export function fitTitle(value: string, measure: (value: string, size: number) => number, o: FitOptions) {
  for (let size = o.size; size > o.minSize; size -= 2) {
    const lines = wrapLines(value, measure, size, o.maxWidth, o.maxLines);
    const fits = lines.length <= o.maxLines
      && lines.length * size * o.lineHeight <= o.maxHeight
      && lines.every(line => measure(line, size) <= o.maxWidth);
    if (fits) return { size, lines };
  }
  return { size: o.minSize, lines: wrapLines(value, measure, o.minSize, o.maxWidth, o.maxLines).slice(0, o.maxLines) };
}

/** Photo area of the Spotify band style: everything outside the band, inset by the frame margin. */
export function bandPhotoRect(size: number, band: number, position: "top" | "bottom", marginPercent: number, bandEdgeMargin: boolean) {
  const inset = Math.round(size * marginPercent / 100);
  const nearBand = bandEdgeMargin ? inset : 0;
  const height = size - band - inset - nearBand;
  const y = position === "top" ? band + nearBand : inset;
  return { x: inset, y, width: size - inset * 2, height };
}

export type SpotifyFont = "standard" | "wide" | "condensed";

/** Highest classic title position (% of the cover) that keeps the title (all its lines), gap, and subtitle above the footer; never below 15%. */
export function classicTitleYMax(titleSize: number, subtitleSize: number, gap: number, titleLineCount = 1) {
  const titleHeight = titleSize + (titleLineCount - 1) * titleSize * CLASSIC_LINE_HEIGHT;
  return Math.max(15, Math.floor((900 - titleHeight - subtitleSize - gap) / 12));
}

/** Title font a style actually uses: This Is always uses the standard face; other Spotify styles use the chosen font. */
export function spotifyFontFor(mode: CoverMode, font: SpotifyFont): SpotifyFont {
  return mode === "spotify-this-is" ? "standard" : font;
}

/** Canvas font weight and family for Spotify titles: SF Pro Bold, the wide brutalist Archivo Expanded Black, or the tall Archivo Condensed Bold. */
export function spotifyFace(font: SpotifyFont) {
  if (font === "wide") return { weight: 900, family: "CoverFontWide, CoverFontBold, Arial, sans-serif" };
  if (font === "condensed") return { weight: 700, family: "CoverFontCondensed, CoverFontBold, Arial, sans-serif" };
  return { weight: 700, family: "CoverFontBold, CoverFont, Arial, sans-serif" };
}

/** Fits a title plus an optional one-line subtitle at its requested size; the title shrinks only to make room for the subtitle.
 *  The gap (default: a quarter of the subtitle size) never shrinks the title: it is capped by the room left over. */
export function fitTitleBlock(title: string, subtitle: string, measure: (value: string, size: number) => number, o: FitOptions & { subtitleSize: number; gap?: number }) {
  const subSize = subtitle.trim() ? o.subtitleSize : 0;
  const main = fitTitle(title, measure, { ...o, maxHeight: o.maxHeight - subSize });
  const titleHeight = main.lines.length * main.size * o.lineHeight;
  const gap = subSize ? Math.max(0, Math.min(o.gap ?? Math.round(subSize * .25), o.maxHeight - titleHeight - subSize)) : 0;
  const sub = subSize ? fitTitle(subtitle, measure, { ...o, size: subSize, minSize: Math.min(16, subSize), maxHeight: subSize, maxLines: 1, lineHeight: 1 }) : null;
  const height = titleHeight + (sub ? gap + sub.size : 0);
  return { title: main, subtitle: sub, gap, height };
}

export type BackgroundType = "gradients" | "custom" | "picture";

/** Shapes of the color background's gradient, in menu order. */
export const GRADIENT_TYPES = ["linear", "radial", "conic", "diamond", "reflected"] as const;
export type GradientType = (typeof GRADIENT_TYPES)[number];

/** Color stops (offset, color) for a color background's gradient, built from the shades of `colorShade`. */
export function colorGradientStops(type: GradientType, shade: { dark: string; base: string; light: string }): [number, string][] {
  if (type === "radial") return [[0, shade.light], [.5, shade.base], [1, shade.dark]];
  if (type === "reflected") return [[0, shade.dark], [.25, shade.base], [.5, shade.light], [.75, shade.base], [1, shade.dark]];
  return [[0, shade.dark], [.5, shade.base], [1, shade.light]];
}

/** Gradient position (0 at the center, 1 at the corners) of a pixel in a diamond gradient: the same value along each diamond-shaped ring. */
export function diamondPosition(x: number, y: number, size: number) {
  const half = size / 2;
  return (Math.abs(x - half) + Math.abs(y - half)) / size;
}

/** Diagonal shade for a solid background: 25% darker at the bottom-left, 18% lighter at the top-right. With the shadow off, every stop is the flat color. */
export function colorShade(hex: string, shadow = true) {
  if (!shadow) return { dark: hex, base: hex, light: hex };
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const toHex = (values: number[]) => `#${values.map(v => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
  return {
    dark: toHex(channels.map(c => c * .75)),
    base: toHex(channels),
    light: toHex(channels.map(c => c + (255 - c) * .18)),
  };
}

/** Background drawn behind a style: Original and Full photo each keep their own choice; other styles have none.
 *  Similar Artist Radio shares Original's choice but has no picture background, so a picture choice falls back to color. */
export function activeBackground(mode: CoverMode, appleBackground: BackgroundType, spotifyBackground: BackgroundType): BackgroundType | null {
  if (mode === "classic") return appleBackground;
  if (mode === "similar-artists") return appleBackground === "picture" ? "custom" : appleBackground;
  if (mode === "spotify-photo") return spotifyBackground;
  return null;
}

/** This Is always draws its heading, title, and logo in this near-black, like Spotify's own covers. */
export const THIS_IS_INK = "#111111";

/** This Is title color on its accent half: white only on a black accent (the black swatch #111111 or pure black), near-black otherwise. */
export function thisIsTitleInk(accent: string) {
  return ["#000000", "#111111"].includes(accent.toLowerCase()) ? "#ffffff" : THIS_IS_INK;
}

/** Logo color: always black in This Is; Band can match the band color; everything else follows the text color. */
export function logoColor(mode: CoverMode, textColor: string, bandColor: string, matchBand: boolean) {
  if (mode === "spotify-this-is") return THIS_IS_INK;
  return mode === "spotify-band" && matchBand ? bandColor : textColor;
}

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type Rect = { x: number; y: number; width: number; height: number };

/** Top-left position of an item placed in a corner of an area, inset by padding. */
export function cornerPosition(corner: Corner, width: number, height: number, area: Rect, pad: number) {
  return {
    x: corner.endsWith("right") ? area.x + area.width - pad - width : area.x + pad,
    y: corner.startsWith("bottom") ? area.y + area.height - pad - height : area.y + pad,
  };
}

/** Area the Band logo is positioned in: the framed photo when the logo sits on the photo side, otherwise the whole cover. */
export function bandLogoArea(size: number, band: number, position: "top" | "bottom", corner: Corner, marginPercent: number, bandEdgeMargin: boolean): Rect {
  const onPhotoSide = !corner.startsWith(position);
  return onPhotoSide && marginPercent > 0
    ? bandPhotoRect(size, band, position, marginPercent, bandEdgeMargin)
    : { x: 0, y: 0, width: size, height: size };
}

/** Logo corner a style actually uses: This Is and Band pin their logo to the top-left, Essentials and Similar Artist Radio pin it to the top-right, other styles use the chosen corner. */
export function logoCornerFor(mode: CoverMode, corner: Corner): Corner {
  if (mode === "spotify-this-is" || mode === "spotify-band") return "top-left";
  if (mode === "essentials" || mode === "similar-artists") return "top-right";
  return corner;
}

/** Logo corner taken by Original's title and subtitle: their position on their alignment side. Other styles take none. */
export function titleCorner(mode: CoverMode, position: "top" | "bottom", align: "left" | "right"): Corner | null {
  return mode === "spotify-photo" ? `${position}-${align}` : null;
}

/** Moves a logo off the title's corner to the other side of the same edge; any other corner is kept. */
export function allowedLogoCorner(corner: Corner, taken: Corner | null): Corner {
  if (corner !== taken) return corner;
  return `${corner.startsWith("top") ? "top" : "bottom"}-${corner.endsWith("left") ? "right" : "left"}`;
}

/** Spotify title alignment a style actually uses: Band aligns left on a bottom band and right on a top band, clear of its top-left logo; Original uses the chosen alignment. */
export function spotifyAlignFor(mode: CoverMode, position: "top" | "bottom", align: "left" | "right"): "left" | "right" {
  if (mode === "spotify-band") return position === "bottom" ? "left" : "right";
  return align;
}

/** Band title box: inset inside the band, with the title and subtitle aligned to its top wherever the band sits. */
export function bandTitleBox(size: number, band: number, position: "top" | "bottom", pad: number) {
  const bandY = position === "top" ? 0 : size - band;
  return { y: bandY + pad, height: band - pad * 2, vertical: "top" as const };
}

type Treatment = { treatment: "original" | "mono" | "duotone"; tint: string; brightness: number; contrast: number };

/** Photo treatment a style starts with: its own default treatment, the default tint, and neutral tone. */
export function treatmentDefaults(mode: CoverMode): Treatment {
  const style = styleDefaults(mode);
  return { treatment: ("treatment" in style && style.treatment) || "original", tint: "#e8e8ed", brightness: 0, contrast: 0 };
}

/** Whether any photo treatment setting differs from a starting look (tint letter case ignored). */
export function treatmentDiffers(start: Treatment, current: Treatment) {
  return current.treatment !== start.treatment || current.tint.toLowerCase() !== start.tint.toLowerCase() || current.brightness !== start.brightness || current.contrast !== start.contrast;
}

/** Whether any photo treatment setting differs from the style's starting look. */
export function treatmentChanged(mode: CoverMode, current: Treatment) {
  return treatmentDiffers(treatmentDefaults(mode), current);
}

/** Crop and photo treatment of Similar Artist Radio's second and third artists (the main artist uses the cover's own settings). */
export type ArtistLook = Treatment & { zoom: number; offsetX: number; offsetY: number };
export const DEFAULT_ARTIST_LOOK: ArtistLook = { zoom: 1, offsetX: 50, offsetY: 50, treatment: "original", tint: "#e8e8ed", brightness: 0, contrast: 0 };

/** The look of artist `index` (0 = second artist), filling any missing field from the defaults. */
export function artistLookAt(looks: readonly Partial<ArtistLook>[], index: number): ArtistLook {
  return { ...DEFAULT_ARTIST_LOOK, ...looks[index] };
}

export type ArtistCount = 1 | 2 | 3;
export type Circle = { x: number; y: number; r: number };

/** Similar Artist Radio bubbles on the 1200px cover, in drawing order: the main artist centered, then
 *  a second artist on its top-left edge and a third on its bottom-right edge, like Apple's own covers. */
export function artistBubbles(count: ArtistCount): Circle[] {
  return [{ x: 600, y: 600, r: 440 }, { x: 281, y: 296, r: 157 }, { x: 906, y: 913, r: 157 }].slice(0, count);
}
