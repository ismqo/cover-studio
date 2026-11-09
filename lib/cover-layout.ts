export type CoverMode = "classic" | "essentials" | "spotify-this-is" | "spotify-band" | "spotify-photo";
export type Platform = "apple" | "spotify";

export const platformModes: Record<Platform, readonly CoverMode[]> = {
  apple: ["classic", "essentials"],
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
    case "spotify-this-is": return { corner: "top-left", textColor: "#111111", bandColor: "#e0a988" } as const;
    case "spotify-band": return { corner: "top-left", textColor: "#111111", bandColor: "#5aa05a", spotifyTitlePosition: "bottom", spotifyAlign: "left" } as const;
    case "spotify-photo": return { corner: "top-left", textColor: "#ff4632", spotifyTitlePosition: "top", spotifyAlign: "right", treatment: "mono" } as const;
  }
}

type FitOptions = { size: number; minSize: number; maxWidth: number; maxHeight: number; maxLines: number; lineHeight: number };

function wrap(value: string, measure: (value: string, size: number) => number, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const word of value.trim().split(/\s+/).filter(Boolean)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && measure(`${last} ${word}`, size) <= maxWidth) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines.length ? lines : [""];
}

/** Wraps a title on word boundaries, shrinking it only when the lines no longer fit the box. */
export function fitTitle(value: string, measure: (value: string, size: number) => number, o: FitOptions) {
  for (let size = o.size; size > o.minSize; size -= 2) {
    const lines = wrap(value, measure, size, o.maxWidth);
    const fits = lines.length <= o.maxLines
      && lines.length * size * o.lineHeight <= o.maxHeight
      && lines.every(line => measure(line, size) <= o.maxWidth);
    if (fits) return { size, lines };
  }
  return { size: o.minSize, lines: wrap(value, measure, o.minSize, o.maxWidth).slice(0, o.maxLines) };
}

/** Photo area of the Spotify band style: everything outside the band, inset by the frame margin. */
export function bandPhotoRect(size: number, band: number, position: "top" | "bottom", marginPercent: number, bandEdgeMargin: boolean) {
  const inset = Math.round(size * marginPercent / 100);
  const nearBand = bandEdgeMargin ? inset : 0;
  const height = size - band - inset - nearBand;
  const y = position === "top" ? band + nearBand : inset;
  return { x: inset, y, width: size - inset * 2, height };
}

export type SpotifyFont = "standard" | "wide";

/** Canvas font weight and family for Spotify titles: SF Pro Bold, or the wide brutalist Archivo Expanded Black. */
export function spotifyFace(font: SpotifyFont) {
  return font === "wide"
    ? { weight: 900, family: "CoverFontWide, CoverFontBold, Arial, sans-serif" }
    : { weight: 700, family: "CoverFontBold, CoverFont, Arial, sans-serif" };
}

/** Fits a title plus an optional one-line subtitle at its requested size; the title shrinks first to make room. */
export function fitTitleBlock(title: string, subtitle: string, measure: (value: string, size: number) => number, o: FitOptions & { subtitleSize: number }) {
  const subSize = subtitle.trim() ? o.subtitleSize : 0;
  const gap = Math.round(subSize * .25);
  const main = fitTitle(title, measure, { ...o, maxHeight: o.maxHeight - subSize - gap });
  const sub = subSize ? fitTitle(subtitle, measure, { ...o, size: subSize, minSize: Math.min(16, subSize), maxHeight: subSize, maxLines: 1, lineHeight: 1 }) : null;
  const height = main.lines.length * main.size * o.lineHeight + (sub ? gap + sub.size : 0);
  return { title: main, subtitle: sub, gap, height };
}

export type BackgroundType = "gradients" | "custom" | "picture";

/** Diagonal shade for a solid background: 25% darker at the bottom-left, 18% lighter at the top-right. */
export function colorShade(hex: string) {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const toHex = (values: number[]) => `#${values.map(v => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
  return {
    dark: toHex(channels.map(c => c * .75)),
    base: toHex(channels),
    light: toHex(channels.map(c => c + (255 - c) * .18)),
  };
}

/** Background drawn behind a style: Original and Full photo each keep their own choice; other styles have none. */
export function activeBackground(mode: CoverMode, appleBackground: BackgroundType, spotifyBackground: BackgroundType): BackgroundType | null {
  if (mode === "classic") return appleBackground;
  if (mode === "spotify-photo") return spotifyBackground;
  return null;
}

/** Logo color: the text color, or the band color when the Band style is set to match it. */
export function logoColor(mode: CoverMode, textColor: string, bandColor: string, matchBand: boolean) {
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

/** Band title box: inset inside the band and anchored to its outer edge (top of a top band, bottom of a bottom band). */
export function bandTitleBox(size: number, band: number, position: "top" | "bottom", pad: number) {
  const bandY = position === "top" ? 0 : size - band;
  return { y: bandY + pad, height: band - pad * 2, vertical: position };
}

type Treatment = { treatment: "original" | "mono" | "duotone"; tint: string; brightness: number; contrast: number };

/** Photo treatment a style starts with: its own default treatment, the default tint, and neutral tone. */
export function treatmentDefaults(mode: CoverMode): Treatment {
  const style = styleDefaults(mode);
  return { treatment: ("treatment" in style && style.treatment) || "original", tint: "#e8e8ed", brightness: 0, contrast: 0 };
}

/** Whether any photo treatment setting differs from the style's starting look. */
export function treatmentChanged(mode: CoverMode, current: Treatment) {
  const start = treatmentDefaults(mode);
  return current.treatment !== start.treatment || current.tint.toLowerCase() !== start.tint || current.brightness !== start.brightness || current.contrast !== start.contrast;
}
