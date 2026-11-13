export type CoverMode = "classic" | "essentials" | "similar-artists" | "spotify-this-is" | "spotify-band" | "spotify-photo" | "spotify-daily-mix";
export type Platform = "apple" | "spotify";

export const platformModes: Record<Platform, readonly CoverMode[]> = {
  apple: ["classic", "essentials", "similar-artists"],
  spotify: ["spotify-photo", "spotify-this-is", "spotify-band", "spotify-daily-mix"],
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
    case "spotify-daily-mix": return { corner: "top-left", ...dailyMixDesignDefaults("classic") } as const;
  }
}

/** Daily Mix designs: Spotify's classic cover (a photo with a wavy edge on a solid color) and its new one (a full photo with color labels). */
export type DailyMixDesign = "classic" | "new";

/** Highest mix number: the new design shows it as two digits. */
export const DAILY_MIX_MAX = 99;

/** Mix number typed in the number field: a whole number clamped to 1–99, or null while the field holds anything else (empty, decimals, text). */
export function parseMixNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  return Math.min(DAILY_MIX_MAX, Math.max(1, Number(trimmed)));
}

/** Settings each Daily Mix design applies when chosen, including its title size. `bandColor` is the classic background, or the new design's label and logo color. */
export function dailyMixDesignDefaults(design: DailyMixDesign) {
  return design === "classic"
    ? { dailyMixDesign: "classic", textColor: "#111111", bandColor: "#f06e94", treatment: "original", dailyMixFontSize: 120 } as const
    : { dailyMixDesign: "new", textColor: "#111111", bandColor: "#1ed7f0", treatment: "mono", dailyMixFontSize: 112 } as const;
}

/** Default size of the new Daily Mix number label's digits, in 1200px cover pixels. */
export const DAILY_MIX_NUMBER_SIZE = 190;

/** Classic Daily Mix title box: its bottom edge stays put at any size, and it grows upward to hold two lines at the chosen size. */
export function dailyMixTitleBox(fontSize: number) {
  const height = Math.max(250, Math.ceil(fontSize * 1.02 * 2));
  return { x: 128, y: 1102 - height, width: 1200 - 128 * 2, height };
}

/** Classic Daily Mix heading: the title (with its line breaks) followed by the mix number on its last line, or the title alone when the number is hidden (null). */
export function dailyMixHeading(title: string, number: number | null) {
  return number === null ? title.trim() : `${title.trim()} ${number}`.trim();
}

/** New Daily Mix number label: always two digits, like "01". */
export function dailyMixNumberLabel(number: number) {
  return String(number).padStart(2, "0");
}

/** Classic Daily Mix photo window on the 1200px cover, fitted to points traced from a Spotify Daily Mix cover with six smooth curves
 *  that meet without kinks (horizontal at the crest, the trough, and the top dips). The fit keeps every bend gentle (no radius under
 *  about 200px) and lets bends ease into each other where curves meet, and its top-left corner opens up to keep as much room around
 *  the logo as the logo keeps from the cover's edges. The color runs along
 *  the top in a shallow band, cresting just right of the logo, dipping softly over the middle and rising to leave the top-right
 *  corner to the photo, and sweeps down around the logo to meet the left edge about a quarter of the way down;
 *  the bottom edge is a wave cresting left of center and dipping toward the bottom-right, above the title. */
export const DAILY_MIX_WAVE = "M873 0L1200 0L1200 973C1147 989 1096 1011 1032 1011C799 1011 678 677 386 677C179 677 132 816 0 851L0 283C169 248 195 86 363 86C423 86 507 109 601 109C719 109 758 77 873 0Z";

/** Default opacity (%) of the classic color outside the window: nearly opaque, so the photo still shows faintly through it, like Spotify's covers. */
export const DAILY_MIX_TINT_OPACITY = 88;

type LabelText = { width: number; ascent: number; font: number };
type Label = { x: number; y: number; width: number; height: number; textX: number; baseline: number };

/** New Daily Mix labels: one title box per title line at the bottom-left, stacked with the last line at the bottom, and the number box
 *  (none when the number is hidden) at the bottom-right, sharing the bottom edge. Each box hugs its text (measured width and ascent above the baseline), with padding
 *  relative to its font size; title boxes share the tallest line's ascent so they are all the same height. */
export function dailyMixLabels(size: number, margin: number, titles: LabelText[], number: LabelText | null): { titles: Label[]; number: Label | null } {
  const box = (text: LabelText, right: boolean, bottom: number): Label => {
    const padX = text.font * .16, padTop = text.font * .2, padBottom = text.font * .22;
    const width = text.width + padX * 2, height = text.ascent + padTop + padBottom;
    const x = right ? size - margin - width : margin;
    const y = bottom - height;
    return { x, y, width, height, textX: x + padX, baseline: y + padTop + text.ascent };
  };
  const ascent = Math.max(0, ...titles.map(line => line.ascent));
  const stacked: Label[] = [];
  let bottom = size - margin;
  for (const line of [...titles].reverse()) {
    const label = box({ ...line, ascent }, false, bottom);
    stacked.unshift(label);
    bottom = label.y;
  }
  return { titles: stacked, number: number ? box(number, true, size - margin) : null };
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

/** Essentials designs: Apple Music's classic cover (a light band with a wide, spaced-out monospaced title over a full-bleed photo) and the current one. */
export type EssentialsDesign = "classic" | "new";

export function essentialsDesignDefaults(design: EssentialsDesign) {
  return design === "classic"
    ? { essentialsDesign: "classic", textColor: "#111111", bandColor: "#e6e6e6" } as const
    : { essentialsDesign: "new", textColor: "#111111", bandColor: "#c4c4c4", essentialsFontSize: 136 } as const;
}

/** Classic Essentials on the 1200px cover, measured from Apple's covers. Title: SF Mono Heavy in capitals at a fixed size (no size
 *  option), tracked so "ESSENTIALS" spans the cover from x 32. Vertical spacing is in ems of the title size: air above the capitals, their height, and air
 *  below them before the photo. The optional subtitle sits a third of the title size under it. The logo (Apple glyph and "MUSIC")
 *  sits in the photo's top-right corner, and the photo sits in a frame of the band color, its sides lined up with the title. */
export const ESSENTIALS_CLASSIC = {
  size: 152, x: 32, maxWidth: 1136, photoInset: 34,
  tracking: .138, capHeight: .705, top: .255, bottom: .228,
  subtitleScale: .33, subtitleGap: .33, subtitleTracking: .1,
  logo: { glyphHeight: 34, textSize: 32, gap: 9, tracking: .06, right: 68, top: 38 },
} as const;

/** Width of `value` drawn with `tracking` ems between its characters. */
export function trackedWidth(value: string, size: number, tracking: number, measure: (value: string, size: number) => number) {
  return measure(value, size) + Math.max(0, [...value].length - 1) * tracking * size;
}

/** Classic Essentials title block: shrinks the title (and, with it, the subtitle) until every line fits the cover's width, then places
 *  the baselines and ends the band below the last line. `measure` gets "title" or "subtitle" to pick the face. */
export function essentialsClassicLayout(title: string[], subtitle: string, fontSize: number, measure: (value: string, size: number, face: "title" | "subtitle") => number) {
  const c = ESSENTIALS_CLASSIC;
  const titleWidth = (line: string, size: number) => trackedWidth(line, size, c.tracking, (v, s) => measure(v, s, "title"));
  let size = fontSize;
  while (size > 12 && title.some(line => titleWidth(line, size) > c.maxWidth)) size--;
  const lines = title.map((text, i) => ({ text, baseline: Math.round(size * (c.top + c.capHeight) + i * size * CLASSIC_LINE_HEIGHT) }));
  const last = lines[lines.length - 1].baseline;
  const text = subtitle.trim();
  let sub: { text: string; size: number; baseline: number } | null = null;
  if (text) {
    let subSize = Math.round(size * c.subtitleScale);
    while (subSize > 8 && trackedWidth(text, subSize, c.subtitleTracking, (v, s) => measure(v, s, "subtitle")) > c.maxWidth) subSize--;
    sub = { text, size: subSize, baseline: Math.round(last + size * c.subtitleGap + subSize * c.capHeight) };
  }
  return { size, lines, subtitle: sub, band: Math.round((sub ? sub.baseline : last) + size * c.bottom) };
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

/** Title fonts a Spotify style offers: Daily Mix has no condensed font; the others offer all three. */
export function spotifyFonts(mode: CoverMode): readonly SpotifyFont[] {
  return mode === "spotify-daily-mix" ? ["standard", "wide"] : ["standard", "wide", "condensed"];
}

/** Title font a style actually uses: This Is always uses the standard face; a font the style does not offer falls back to standard;
 *  other Spotify styles use the chosen font. */
export function spotifyFontFor(mode: CoverMode, font: SpotifyFont): SpotifyFont {
  return mode === "spotify-this-is" || !spotifyFonts(mode).includes(font) ? "standard" : font;
}

/** Canvas font weight and family for Spotify titles: SF Pro Bold, the wide brutalist Archivo Expanded Black, or the tall Archivo Condensed Bold. */
export function spotifyFace(font: SpotifyFont) {
  if (font === "wide") return { weight: 900, family: "CoverFontWide, CoverFontBold, Arial, sans-serif" };
  if (font === "condensed") return { weight: 700, family: "CoverFontCondensed, CoverFontBold, Arial, sans-serif" };
  return { weight: 700, family: "CoverFontBold, CoverFont, Arial, sans-serif" };
}

/** New Daily Mix number face: with the standard font, Unbounded Regular, whose wide round digits match Spotify's number labels;
 *  otherwise the title's own face. */
export function dailyMixNumberFace(font: SpotifyFont) {
  return font === "standard" ? { weight: 400, family: "CoverFontMix, CoverFontBold, Arial, sans-serif" } : spotifyFace(font);
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
export const GRADIENT_TYPES = ["linear", "radial", "diamond", "reflected"] as const;
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

/** Logo color: always black in This Is; Band can match the band color; the new Daily Mix uses its label color; everything else follows the text color. */
export function logoColor(mode: CoverMode, textColor: string, bandColor: string, matchBand: boolean, dailyMixDesign?: DailyMixDesign) {
  if (mode === "spotify-this-is") return THIS_IS_INK;
  if (mode === "spotify-daily-mix" && dailyMixDesign === "new") return bandColor;
  return mode === "spotify-band" && matchBand ? bandColor : textColor;
}

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/** Spotify logo on the 1200px cover: its diameter and its distance from the cover's edges. */
export const SPOTIFY_LOGO = { size: 104, pad: 48 } as const;
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

/** Logo corner a style actually uses: This Is, Band, and Daily Mix pin their logo to the top-left, Essentials and Similar Artist Radio pin it to the top-right, other styles use the chosen corner. */
export function logoCornerFor(mode: CoverMode, corner: Corner): Corner {
  if (mode === "spotify-this-is" || mode === "spotify-band" || mode === "spotify-daily-mix") return "top-left";
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

/** Photo treatment a style starts with: its own default treatment (Daily Mix: its design's), the default tint, and neutral tone. */
export function treatmentDefaults(mode: CoverMode, dailyMixDesign?: DailyMixDesign): Treatment {
  const style = mode === "spotify-daily-mix" && dailyMixDesign ? dailyMixDesignDefaults(dailyMixDesign) : styleDefaults(mode);
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
