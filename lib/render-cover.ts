import { APPLE_GLYPH_BOX, APPLE_GLYPH_PATH, appleLogoShape, type AppleLogoStyle } from "./apple-logo";
import { SPOTIFY_PATH } from "./spotify-logo";
import { CLASSIC_LINE_HEIGHT, essentialsTitleBlock, essentialsClassicLayout, ESSENTIALS_CLASSIC, trackedWidth, type EssentialsDesign, titleLines, THIS_IS_INK, activeBackground, spotifyFontFor, thisIsTitleInk, allowedLogoCorner, logoCornerFor, spotifyAlignFor, titleCorner, classicTitleYMax, colorShade, bandLogoArea, bandPhotoRect, bandTitleBox, cornerPosition, fitTitle, fitTitleBlock, logoColor, platformOf, spotifyFace, artistBubbles, artistLookAt, DEFAULT_ARTIST_LOOK, type ArtistLook, colorGradientStops, diamondPosition, SPOTIFY_LOGO, dailyMixHeading, dailyMixLabels, dailyMixTitleBox, DAILY_MIX_NUMBER_SIZE, dailyMixNumberFace, dailyMixNumberLabel, DAILY_MIX_TINT_OPACITY, DAILY_MIX_WAVE, type DailyMixDesign, type GradientType, type ArtistCount, type Circle, type BackgroundType, type CoverMode, type SpotifyFont } from "./cover-layout";

export type CoverSettings = {
  mode: CoverMode;
  title: string; subtitle: string; footer: string; essentialsTitle: string;
  spotifyTitle: string; spotifyKicker: string; spotifyFontSize: number;
  spotifyTitlePosition: "top" | "bottom"; spotifyAlign: "left" | "right";
  spotifySubtitle: string; spotifyShowSubtitle: boolean; spotifyFont: SpotifyFont;
  spotifyKickerFontSize: number; spotifySubtitleFontSize: number; spotifySubtitleGap: number;
  appleLogo: AppleLogoStyle; logoMatchesBand: boolean;
  classicAlign: "left" | "center"; classicTitleY: number;
  classicFontSize: number; classicSubtitleFontSize: number; classicSubtitleGap: number;
  classicTitleWeight: "normal" | "bold"; classicSubtitleWeight: "normal" | "bold";
  showLogo: boolean; corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  backgroundType: BackgroundType; spotifyBackgroundType: BackgroundType;
  gradient: number; customColor: string; colorShadow: boolean; gradientType: GradientType;
  textColor: string; bandColor: string; bandHeight: number; essentialsFontSize: number;
  /** Essentials: its design, and the classic design's optional subtitle under the title. */
  essentialsDesign: EssentialsDesign; essentialsSubtitle: string;
  treatment: "original" | "mono" | "duotone"; tint: string;
  brightness: number; contrast: number;
  photoMargin: number; photoTopMargin: boolean; photoRadius: number;
  zoom: number; offsetX: number; offsetY: number;
  /** Similar Artist Radio: how many artist bubbles, and the crop and treatment of the second and third artists (the main artist uses the fields above). */
  artistCount: ArtistCount; artistLooks: ArtistLook[];
  /** Daily Mix: its design, its title and title size, its mix number with whether it shows and its size (new design), and the classic color's opacity (%) over the photo. */
  dailyMixDesign: DailyMixDesign; dailyMixTitle: string; dailyMixFontSize: number; dailyMixNumber: number; dailyMixShowNumber: boolean; dailyMixNumberSize: number; dailyMixTintOpacity: number;
};

export const defaults: CoverSettings = {
  mode: "classic", title: "Title", subtitle: "Subtitle", footer: "Description",
  classicAlign: "left", classicTitleY: 22, classicFontSize: 192, classicSubtitleFontSize: 160, classicSubtitleGap: 0,
  classicTitleWeight: "bold", classicSubtitleWeight: "normal",
  essentialsTitle: "Essentials", spotifyTitle: "Title", spotifyKicker: "THIS IS", spotifyFontSize: 150,
  spotifyTitlePosition: "bottom", spotifyAlign: "left", spotifySubtitle: "Subtitle", spotifyShowSubtitle: false, spotifyFont: "standard", spotifyKickerFontSize: 120, spotifySubtitleFontSize: 64, spotifySubtitleGap: 16, appleLogo: "classic", logoMatchesBand: false, showLogo: true, corner: "top-left",
  backgroundType: "gradients", spotifyBackgroundType: "picture", gradient: 0, customColor: "#7865a8", colorShadow: true, gradientType: "linear",
  textColor: "#ffffff", bandColor: "#c4c4c4", bandHeight: 31, essentialsFontSize: 136, essentialsDesign: "new", essentialsSubtitle: "",
  treatment: "original", tint: "#e8e8ed", brightness: 0, contrast: 0, photoMargin: 0, photoTopMargin: false, photoRadius: 0,
  zoom: 1, offsetX: 50, offsetY: 50,
  artistCount: 3, artistLooks: [DEFAULT_ARTIST_LOOK, DEFAULT_ARTIST_LOOK],
  dailyMixDesign: "classic", dailyMixTitle: "Daily Mix", dailyMixFontSize: 120, dailyMixNumber: 1, dailyMixNumberSize: DAILY_MIX_NUMBER_SIZE, dailyMixShowNumber: true, dailyMixTintOpacity: DAILY_MIX_TINT_OPACITY,
};

const images = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  if (!images.has(src)) images.set(src, new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => { images.delete(src); reject(new Error("Unable to load this image. Try a JPG, PNG, or WebP file.")); };
    image.src = src;
  }));
  return images.get(src)!;
}
export function releaseImage(src: string) { images.delete(src); URL.revokeObjectURL(src); }

/** Draws `value` one character at a time with `tracking` pixels between characters, in the current font and baseline. */
function trackedText(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, tracking: number) {
  for (const char of value) {
    ctx.fillText(char, x, y);
    x += ctx.measureText(char).width + tracking;
  }
}

/** Classic Essentials logo: the Apple glyph and "MUSIC" in spaced capitals, in the photo's top-right corner just under the band. */
function drawClassicEssentialsLogo(ctx: CanvasRenderingContext2D, size: number, band: number, color: string) {
  const l = ESSENTIALS_CLASSIC.logo;
  const scale = l.glyphHeight / APPLE_GLYPH_BOX.height;
  const glyphWidth = APPLE_GLYPH_BOX.width * scale;
  ctx.font = `600 ${l.textSize}px CoverFont, Arial, sans-serif`;
  const word = "MUSIC";
  const wordWidth = trackedWidth(word, l.textSize, l.tracking, value => ctx.measureText(value).width);
  const x = size - l.right - glyphWidth - l.gap - wordWidth;
  const y = band + l.top;
  ctx.save();
  ctx.fillStyle = color;
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.translate(-APPLE_GLYPH_BOX.x, -APPLE_GLYPH_BOX.y); ctx.fill(new Path2D(APPLE_GLYPH_PATH)); ctx.restore();
  ctx.textBaseline = "alphabetic";
  trackedText(ctx, word, x + glyphWidth + l.gap, y + l.glyphHeight, l.tracking * l.textSize);
  ctx.restore();
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, weight: number, width: number) {
  textLines(ctx, [value], x, y, size, weight, width);
}

/** Draws lines one below the other at the requested pitch, shrinking them all together until the widest fits. */
function textLines(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, size: number, weight: number, width: number) {
  let fitted = size;
  ctx.font = `${weight} ${fitted}px CoverFont, Arial, sans-serif`;
  while (lines.some(line => ctx.measureText(line).width > width) && fitted > 5) {
    fitted -= 1;
    ctx.font = `${weight} ${fitted}px CoverFont, Arial, sans-serif`;
  }
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * size * CLASSIC_LINE_HEIGHT));
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  uploaded: HTMLImageElement | null,
  s: CoverSettings,
  photoX: number,
  photoY: number,
  photoWidth: number,
  photoHeight: number,
  photoRadius: number,
  /** Builds the clip path, or returns it as a Path2D. */
  outline: () => Path2D | void = () => roundedRect(ctx, photoX, photoY, photoWidth, photoHeight, photoRadius),
) {
  const clip = () => { const path = outline(); if (path) ctx.clip(path); else ctx.clip(); };
  if (uploaded) {
    const photoCanvas = document.createElement("canvas");
    photoCanvas.width = photoWidth;
    photoCanvas.height = photoHeight;
    const photoCtx = photoCanvas.getContext("2d")!;
    const scale = Math.max(photoWidth / uploaded.width, photoHeight / uploaded.height) * s.zoom;
    const w = uploaded.width * scale, h = uploaded.height * scale;
    photoCtx.drawImage(uploaded, (photoWidth - w) * s.offsetX / 100, (photoHeight - h) * s.offsetY / 100, w, h);
    const adjustTone = s.brightness !== 0 || s.contrast !== 0;
    if (s.treatment !== "original" || adjustTone) {
      const pixels = photoCtx.getImageData(0, 0, photoWidth, photoHeight);
      const tint = s.treatment === "mono" ? [255, 255, 255] : [1, 3, 5].map(i => parseInt(s.tint.slice(i, i + 2), 16));
      const contrast = (s.contrast + 100) / 100;
      const brightness = s.brightness * 2.55;
      const tone = (value: number) => Math.max(0, Math.min(255, (value - 127.5) * contrast + 127.5 + brightness));
      for (let i = 0; i < pixels.data.length; i += 4) {
        let r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
        if (adjustTone) {
          r = tone(r);
          g = tone(g);
          b = tone(b);
        }
        if (s.treatment !== "original") {
          const luma = (r * .2126 + g * .7152 + b * .0722) / 255;
          for (let c = 0; c < 3; c++) pixels.data[i + c] = Math.round(tint[c] * luma);
        } else {
          pixels.data[i] = r;
          pixels.data[i + 1] = g;
          pixels.data[i + 2] = b;
        }
      }
      photoCtx.putImageData(pixels, 0, 0);
    }
    ctx.save();
    clip();
    ctx.drawImage(photoCanvas, photoX, photoY);
    ctx.restore();
  } else {
    const placeholder = ctx.createLinearGradient(photoX, photoY, photoX + photoWidth, photoY + photoHeight);
    placeholder.addColorStop(0, "#777777");
    placeholder.addColorStop(1, "#262629");
    ctx.save();
    clip();
    ctx.fillStyle = placeholder;
    ctx.fillRect(photoX, photoY, photoWidth, photoHeight);
    ctx.restore();
  }
}


/** Space between a small artist bubble and the main bubble it overlaps, in 1200px cover pixels. */
const ARTIST_BUBBLE_GAP = 14;

/** Similar Artist Radio bubbles: the main artist, cut away around the smaller artists so the background shows between them,
 *  then the smaller artists. Each artist has its own crop and treatment; bubbles have no shadow or border. */
function renderArtists(ctx: CanvasRenderingContext2D, s: CoverSettings, main: HTMLImageElement | null, others: (HTMLImageElement | null)[]) {
  const circle = (target: CanvasRenderingContext2D, c: Circle) => { target.beginPath(); target.arc(c.x, c.y, c.r, 0, Math.PI * 2); target.closePath(); };
  const drawBubble = (target: CanvasRenderingContext2D, bubble: Circle, i: number) => {
    const photo = i === 0 ? main : others[i - 1] ?? null;
    const look = i === 0 ? s : { ...s, ...artistLookAt(s.artistLooks, i - 1) };
    drawPhoto(target, photo, look, bubble.x - bubble.r, bubble.y - bubble.r, bubble.r * 2, bubble.r * 2, 0, () => circle(target, bubble));
  };
  // The main bubble is drawn on its own layer so the gaps around the smaller bubbles erase only it, not the background.
  const [mainBubble, ...smallBubbles] = artistBubbles(s.artistCount);
  const layer = document.createElement("canvas");
  layer.width = ctx.canvas.width;
  layer.height = ctx.canvas.height;
  const main2d = layer.getContext("2d")!;
  drawBubble(main2d, mainBubble, 0);
  main2d.globalCompositeOperation = "destination-out";
  for (const bubble of smallBubbles) { circle(main2d, { ...bubble, r: bubble.r + ARTIST_BUBBLE_GAP }); main2d.fill(); }
  ctx.drawImage(layer, 0, 0);
  smallBubbles.forEach((bubble, i) => drawBubble(ctx, bubble, i + 1));
}

/** Draws the official Spotify icon; the even-odd fill leaves the sound waves see-through. */
function drawSpotifyLogo(ctx: CanvasRenderingContext2D, x: number, y: number, diameter: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(diameter / 24, diameter / 24);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(SPOTIFY_PATH), "evenodd");
  ctx.restore();
}

/** Draws a wrapped Spotify title, plus an optional smaller subtitle line under it, inside a box. */
function spotifyTitle(ctx: CanvasRenderingContext2D, face: { weight: number; family: string }, value: string, box: { x: number; y: number; width: number; height: number }, size: number, align: "left" | "right" | "center", vertical: "top" | "center" | "bottom", maxLines: number, subtitle = "", subtitleSize = 0, gap?: number) {
  const lineHeight = 1.02;
  const measure = (line: string, fontSize: number) => { ctx.font = `${face.weight} ${fontSize}px ${face.family}`; return ctx.measureText(line).width; };
  const fitted = fitTitleBlock(value, subtitle, measure, { size, minSize: 24, maxWidth: box.width, maxHeight: box.height, maxLines, lineHeight, subtitleSize, gap });
  const top = vertical === "top" ? box.y : vertical === "bottom" ? box.y + box.height - fitted.height : box.y + (box.height - fitted.height) / 2;
  ctx.textAlign = align;
  const x = align === "left" ? box.x : align === "right" ? box.x + box.width : box.x + box.width / 2;
  const { title, subtitle: sub } = fitted;
  ctx.font = `${face.weight} ${title.size}px ${face.family}`;
  title.lines.forEach((line, i) => ctx.fillText(line, x, top + i * title.size * lineHeight));
  if (sub) {
    ctx.font = `${face.weight} ${sub.size}px ${face.family}`;
    ctx.fillText(sub.lines[0], x, top + title.lines.length * title.size * lineHeight + fitted.gap);
  }
  ctx.textAlign = "left";
}

function renderSpotify(ctx: CanvasRenderingContext2D, s: CoverSettings, uploaded: HTMLImageElement | null, size: number) {
  const pad = 48;
  const face = spotifyFace(s.spotifyFont);
  // Keep titles clear of a logo sitting on the same edge.
  const logoInset = (edge: "top" | "bottom") => {
    const reserve = s.showLogo && s.corner.startsWith(edge) ? 150 : 0;
    return { x: pad + (s.corner.endsWith("left") ? reserve : 0), width: size - pad * 2 - reserve };
  };
  ctx.fillStyle = s.textColor;
  if (s.mode === "spotify-daily-mix") {
    renderDailyMix(ctx, s, uploaded, size, face);
    return;
  }
  if (s.mode === "spotify-this-is") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size / 2);
    ctx.fillStyle = s.bandColor;
    ctx.fillRect(0, size / 2, size, size / 2);
    drawPhoto(ctx, uploaded, s, 240, 250, 720, 720, 0);
    const reserve = s.showLogo && s.corner.startsWith("top") ? 150 : 0;
    ctx.fillStyle = THIS_IS_INK;
    // The "THIS IS" heading always uses the wide face, like Spotify's own covers; the font switch only affects the name.
    spotifyTitle(ctx, spotifyFace("wide"), s.spotifyKicker, { x: pad + reserve, y: 58, width: size - (pad + reserve) * 2, height: 178 }, s.spotifyKickerFontSize, "center", "center", 1);
    ctx.fillStyle = thisIsTitleInk(s.bandColor);
    spotifyTitle(ctx, face, s.spotifyTitle, { x: pad, y: 995, width: size - pad * 2, height: 170 }, s.spotifyFontSize, "center", "center", Math.min(2, titleLines(s.spotifyTitle).length));
    return;
  }
  const align = s.spotifyAlign;
  if (s.mode === "spotify-band") {
    const band = Math.round(size * s.bandHeight / 100);
    const bandY = s.spotifyTitlePosition === "top" ? 0 : size - band;
    ctx.fillStyle = s.bandColor;
    ctx.fillRect(0, 0, size, size);
    const photoBox = bandPhotoRect(size, band, s.spotifyTitlePosition, s.photoMargin, s.photoTopMargin);
    drawPhoto(ctx, uploaded, s, photoBox.x, photoBox.y, photoBox.width, photoBox.height, Math.round(size * s.photoRadius / 100));
    ctx.fillStyle = s.bandColor;
    ctx.fillRect(0, bandY, size, band);
    ctx.fillStyle = s.textColor;
    const titleBox = bandTitleBox(size, band, s.spotifyTitlePosition, pad);
    spotifyTitle(ctx, face, s.spotifyTitle, { ...logoInset(s.spotifyTitlePosition), y: titleBox.y, height: titleBox.height }, s.spotifyFontSize, align, titleBox.vertical, 2, s.spotifyShowSubtitle ? s.spotifySubtitle : "", s.spotifySubtitleFontSize, s.spotifySubtitleGap);
    return;
  }
  // Full photo: the background (photo, gradient, color, or solid) is drawn by renderCover; only the photo is drawn here.
  if (s.spotifyBackgroundType === "picture") drawPhoto(ctx, uploaded, s, 0, 0, size, size, 0);
  ctx.fillStyle = s.textColor;
  const height = size * .45;
  const y = s.spotifyTitlePosition === "top" ? 40 : size - 40 - height;
  spotifyTitle(ctx, face, s.spotifyTitle, { ...logoInset(s.spotifyTitlePosition), y, height }, s.spotifyFontSize, align, s.spotifyTitlePosition, 3, s.spotifyShowSubtitle ? s.spotifySubtitle : "", s.spotifySubtitleFontSize, s.spotifySubtitleGap);
}

/** Daily Mix. Classic: the photo through a wavy window in a nearly opaque color, and the title with its number at the bottom-left.
 *  New: a full photo with each title line in a color label at the bottom-left and the two-digit number in one at the bottom-right. */
function renderDailyMix(ctx: CanvasRenderingContext2D, s: CoverSettings, uploaded: HTMLImageElement | null, size: number, face: { weight: number; family: string }) {
  if (s.dailyMixDesign === "classic") {
    drawPhoto(ctx, uploaded, s, 0, 0, size, size, 0);
    // The color covers everything outside the window: the whole cover minus the window, filled even-odd.
    const tint = new Path2D(`M0 0H${size}V${size}H0Z`);
    tint.addPath(new Path2D(DAILY_MIX_WAVE));
    ctx.save();
    ctx.globalAlpha = Math.min(100, Math.max(0, s.dailyMixTintOpacity)) / 100;
    ctx.fillStyle = s.bandColor;
    ctx.fill(tint, "evenodd");
    ctx.restore();
    ctx.fillStyle = s.textColor;
    // One line sits on the bottom edge of the box; a second line grows upward.
    spotifyTitle(ctx, face, dailyMixHeading(s.dailyMixTitle, s.dailyMixShowNumber ? s.dailyMixNumber : null), dailyMixTitleBox(s.dailyMixFontSize), s.dailyMixFontSize, "left", "bottom", 2);
    return;
  }
  drawPhoto(ctx, uploaded, s, 0, 0, size, size, 0);
  const margin = 40, gap = 24;
  ctx.textBaseline = "alphabetic";
  const numberFace = dailyMixNumberFace(s.spotifyFont);
  const measure = (value: string, font: number, typeface = face) => {
    ctx.font = `${typeface.weight} ${font}px ${typeface.family}`;
    const metrics = ctx.measureText(value);
    return { width: metrics.width, ascent: metrics.actualBoundingBoxAscent, font };
  };
  const number = dailyMixNumberLabel(s.dailyMixNumber);
  const lines = titleLines(s.dailyMixTitle, 2).filter(Boolean);
  const numberText = s.dailyMixShowNumber ? measure(number, s.dailyMixNumberSize, numberFace) : null;
  // A long title shrinks, all lines together, to stay clear of the number label (or of the right margin when it is hidden).
  const numberLabel = dailyMixLabels(size, margin, [], numberText).number;
  const room = size - margin * 2 - (numberLabel ? numberLabel.width + gap : 0);
  let font = s.dailyMixFontSize;
  let titleText = lines.map(line => measure(line, font));
  while (titleText.some(line => line.width + font * .32 > room) && font > 40) { font -= 2; titleText = lines.map(line => measure(line, font)); }
  const labels = dailyMixLabels(size, margin, titleText, numberText);
  const draw = (label: NonNullable<typeof labels.number>, value: string, font: number, typeface = face) => {
    ctx.fillStyle = s.bandColor;
    ctx.fillRect(label.x, label.y, label.width, label.height);
    ctx.fillStyle = s.textColor;
    ctx.font = `${typeface.weight} ${font}px ${typeface.family}`;
    ctx.fillText(value, label.textX, label.baseline);
  };
  labels.titles.forEach((label, i) => draw(label, lines[i], font));
  if (labels.number && numberText) draw(labels.number, number, numberText.font, numberFace);
  ctx.textBaseline = "top";
}

/** Color background: the chosen color shaded darker and lighter in the chosen gradient shape (flat when the shadow is off). */
function fillColorBackground(ctx: CanvasRenderingContext2D, color: string, shadow: boolean, type: GradientType, size: number) {
  const stops = colorGradientStops(type, colorShade(color, shadow));
  if (type === "diamond") {
    // Canvas has no diamond gradient, so each pixel is colored from its diamond position.
    const rgb = stops.map(([offset, hex]) => [offset, ...[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))]);
    const pixels = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const t = Math.min(1, diamondPosition(x + .5, y + .5, size));
      const next = Math.max(1, rgb.findIndex(([offset]) => offset >= t));
      const [from, to] = [rgb[next - 1], rgb[next]];
      const mix = (t - from[0]) / (to[0] - from[0] || 1);
      const i = (y * size + x) * 4;
      for (let c = 1; c < 4; c++) pixels.data[i + c - 1] = Math.round(from[c] + (to[c] - from[c]) * mix);
      pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    return;
  }
  const fill = type === "radial" ? ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * Math.SQRT1_2)
    : ctx.createLinearGradient(0, size, size, 0);
  for (const [offset, hex] of stops) fill.addColorStop(offset, hex);
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, size, size);
}

// Preview and export share this renderer, including crop and pixel-level color treatment.
export async function renderCover(canvas: HTMLCanvasElement, s: CoverSettings, photo: string | null, artistPhotos: readonly (string | null)[] = []) {
  const spotifyAlign = spotifyAlignFor(s.mode, s.spotifyTitlePosition, s.spotifyAlign);
  s = { ...s, spotifyAlign, spotifyFont: spotifyFontFor(s.mode, s.spotifyFont), corner: allowedLogoCorner(logoCornerFor(s.mode, s.corner), titleCorner(s.mode, s.spotifyTitlePosition, spotifyAlign)) };
  const size = 1200;
  const spotify = platformOf(s.mode) === "spotify";
  const backgroundType = activeBackground(s.mode, s.backgroundType, s.spotifyBackgroundType);
  const background = backgroundType === "gradients" ? await loadImage(`/assets/gradients/${s.gradient}.png`) : null;
  const uploaded = photo ? await loadImage(photo) : null;
  const classicEssentials = s.mode === "essentials" && s.essentialsDesign === "classic";
  const artists = s.mode === "similar-artists" ? await Promise.all(artistPhotos.slice(0, s.artistCount - 1).map(src => src ? loadImage(src) : null)) : [];
  await Promise.all([document.fonts.load('600 100px CoverFont'), document.fonts.load('300 100px CoverFont'), document.fonts.load('400 100px CoverFont'), ...(classicEssentials ? [document.fonts.load('800 100px CoverFontMono'), document.fonts.load('700 100px CoverFontBold')] : []), ...(spotify ? [document.fonts.load('700 100px CoverFontBold'), document.fonts.load('900 100px CoverFontWide'), document.fonts.load('700 100px CoverFontCondensed'), document.fonts.load('400 100px CoverFontMix')] : [])]);
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "top";
  if (backgroundType === "custom") {
    fillColorBackground(ctx, s.customColor, s.colorShadow, s.gradientType, size);
  } else {
    ctx.fillStyle = s.customColor;
    ctx.fillRect(0, 0, size, size);
  }
  if (background) ctx.drawImage(background, 0, 0, size, size);
  const band = Math.round(size * s.bandHeight / 100);
  // The classic Essentials band follows its title; the logo sits just under it.
  let classicBand = 0;
  if (spotify) {
    renderSpotify(ctx, s, uploaded, size);
  } else if (s.mode === "similar-artists") {
    renderArtists(ctx, s, uploaded, artists);
  } else if (classicEssentials) {
    const fonts = { title: "800 {size}px CoverFontMono, CoverFontBold, monospace", subtitle: "700 {size}px CoverFontBold, Arial, sans-serif" };
    const font = (face: "title" | "subtitle", px: number) => fonts[face].replace("{size}", String(px));
    const measure = (value: string, px: number, face: "title" | "subtitle") => { ctx.font = font(face, px); return ctx.measureText(value).width; };
    const layout = essentialsClassicLayout(titleLines(s.essentialsTitle.toUpperCase()), s.essentialsSubtitle.toUpperCase(), ESSENTIALS_CLASSIC.size, measure);
    classicBand = layout.band;
    ctx.fillStyle = s.bandColor;
    ctx.fillRect(0, 0, size, size);
    const inset = ESSENTIALS_CLASSIC.photoInset;
    drawPhoto(ctx, uploaded, s, inset, layout.band, size - inset * 2, size - layout.band - inset, 0);
    ctx.fillStyle = s.bandColor;
    ctx.fillRect(0, 0, size, layout.band);
    ctx.fillStyle = s.textColor;
    ctx.textBaseline = "alphabetic";
    ctx.font = font("title", layout.size);
    layout.lines.forEach(line => trackedText(ctx, line.text, ESSENTIALS_CLASSIC.x, line.baseline, layout.size * ESSENTIALS_CLASSIC.tracking));
    if (layout.subtitle) {
      ctx.globalAlpha = .65;
      ctx.font = font("subtitle", layout.subtitle.size);
      trackedText(ctx, layout.subtitle.text, ESSENTIALS_CLASSIC.x, layout.subtitle.baseline, layout.subtitle.size * ESSENTIALS_CLASSIC.subtitleTracking);
      ctx.globalAlpha = 1;
    }
    ctx.textBaseline = "top";
  } else if (s.mode === "essentials") {
    const title = titleLines(s.essentialsTitle);
    const block = essentialsTitleBlock(band, s.essentialsFontSize, title.length);
    const inset = Math.round(size * s.photoMargin / 100);
    const photoX = inset;
    const photoY = block.band + (s.photoTopMargin ? inset : 0);
    const photoWidth = size - inset * 2;
    const photoHeight = size - photoY - inset;
    const photoRadius = Math.round(size * s.photoRadius / 100);
    ctx.fillStyle = s.bandColor;
    ctx.fillRect(0, 0, size, size);
    drawPhoto(ctx, uploaded, s, photoX, photoY, photoWidth, photoHeight, photoRadius);
    ctx.fillStyle = s.bandColor;
    ctx.fillRect(0, 0, size, block.band);
    ctx.fillStyle = s.textColor;
    textLines(ctx, title, 48, block.y, s.essentialsFontSize, 600, 1104);
  } else {
    if (s.backgroundType === "picture") {
      drawPhoto(ctx, uploaded, s, 0, 0, size, size, 0);
    }
    ctx.fillStyle = s.textColor;
    ctx.textAlign = s.classicAlign;
    const classicX = s.classicAlign === "center" ? size / 2 : 100;
    const title = titleLines(s.title);
    const maxTitleY = classicTitleYMax(s.classicFontSize, s.classicSubtitleFontSize, s.classicSubtitleGap, title.length);
    const titleY = Math.round(size * Math.min(s.classicTitleY, maxTitleY) / 100);
    const titleHeight = s.classicFontSize + (title.length - 1) * s.classicFontSize * CLASSIC_LINE_HEIGHT;
    textLines(ctx, title, classicX, titleY, s.classicFontSize, s.classicTitleWeight === "bold" ? 600 : 300, 1000);
    text(ctx, s.subtitle, classicX, titleY + titleHeight + s.classicSubtitleGap, s.classicSubtitleFontSize, s.classicSubtitleWeight === "bold" ? 600 : 300, 1000);
    ctx.textAlign = "left";
    ctx.globalAlpha = .65;
    text(ctx, s.footer, 100, s.showLogo && s.corner.startsWith("bottom") ? 954 : 1060, 60, 400, 1000);
    ctx.globalAlpha = 1;
  }
  if (s.showLogo && spotify) {
    const d = SPOTIFY_LOGO.size;
    // In Band, a framed photo moves the logo into the photo's corner instead of the cover's.
    const area = s.mode === "spotify-band"
      ? bandLogoArea(size, band, s.spotifyTitlePosition, s.corner, s.photoMargin, s.photoTopMargin)
      : { x: 0, y: 0, width: size, height: size };
    const { x, y } = cornerPosition(s.corner, d, d, area, SPOTIFY_LOGO.pad);
    drawSpotifyLogo(ctx, x, y, d, logoColor(s.mode, s.textColor, s.bandColor, s.logoMatchesBand, s.dailyMixDesign));
  } else if (s.showLogo && classicEssentials) {
    drawClassicEssentialsLogo(ctx, size, classicBand, s.textColor);
  } else if (s.showLogo) {
    const logoCorner = s.corner;
    const logo = appleLogoShape(s.appleLogo);
    const w = s.mode === "essentials" ? 260 : 240;
    const h = w * logo.height / logo.width;
    const padding = s.mode === "essentials" ? 48 : s.mode === "similar-artists" ? 64 : 100;
    const x = logoCorner.endsWith("right") ? size - padding - w : padding;
    const y = logoCorner.startsWith("bottom") ? size - 48 - h : 48;
    ctx.save(); ctx.translate(x, y); ctx.scale(w / logo.width, h / logo.height);
    ctx.fillStyle = s.textColor; ctx.fill(new Path2D(logo.path)); ctx.restore();
  }
}
