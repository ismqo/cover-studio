import { appleLogoShape, type AppleLogoStyle } from "./apple-logo";
import { SPOTIFY_PATH } from "./spotify-logo";
import { activeBackground, colorShade, bandLogoArea, bandPhotoRect, bandTitleBox, cornerPosition, fitTitle, fitTitleBlock, logoColor, platformOf, spotifyFace, type BackgroundType, type CoverMode, type SpotifyFont } from "./cover-layout";

export type CoverSettings = {
  mode: CoverMode;
  title: string; subtitle: string; footer: string; essentialsTitle: string;
  spotifyTitle: string; spotifyKicker: string; spotifyFontSize: number;
  spotifyTitlePosition: "top" | "bottom"; spotifyAlign: "left" | "right";
  spotifySubtitle: string; spotifyShowSubtitle: boolean; spotifyFont: SpotifyFont;
  spotifyKickerFontSize: number; spotifySubtitleFontSize: number;
  appleLogo: AppleLogoStyle; logoMatchesBand: boolean;
  classicAlign: "left" | "center"; classicTitleY: number;
  classicFontSize: number; classicSubtitleFontSize: number;
  classicTitleWeight: "normal" | "bold"; classicSubtitleWeight: "normal" | "bold";
  showLogo: boolean; corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  backgroundType: BackgroundType; spotifyBackgroundType: BackgroundType;
  gradient: number; customColor: string;
  textColor: string; bandColor: string; bandHeight: number; essentialsFontSize: number;
  treatment: "original" | "mono" | "duotone"; tint: string;
  brightness: number; contrast: number;
  photoMargin: number; photoTopMargin: boolean; photoRadius: number;
  zoom: number; offsetX: number; offsetY: number;
};

export const defaults: CoverSettings = {
  mode: "classic", title: "Title", subtitle: "Subtitle", footer: "Description",
  classicAlign: "left", classicTitleY: 22, classicFontSize: 192, classicSubtitleFontSize: 160,
  classicTitleWeight: "bold", classicSubtitleWeight: "normal",
  essentialsTitle: "Essentials", spotifyTitle: "Title", spotifyKicker: "THIS IS", spotifyFontSize: 150,
  spotifyTitlePosition: "bottom", spotifyAlign: "left", spotifySubtitle: "Subtitle", spotifyShowSubtitle: false, spotifyFont: "standard", spotifyKickerFontSize: 120, spotifySubtitleFontSize: 64, appleLogo: "classic", logoMatchesBand: false, showLogo: true, corner: "top-left",
  backgroundType: "gradients", spotifyBackgroundType: "picture", gradient: 0, customColor: "#7865a8",
  textColor: "#ffffff", bandColor: "#c4c4c4", bandHeight: 31, essentialsFontSize: 136,
  treatment: "original", tint: "#e8e8ed", brightness: 0, contrast: 0, photoMargin: 0, photoTopMargin: false, photoRadius: 0,
  zoom: 1, offsetX: 50, offsetY: 50,
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

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, weight: number, width: number) {
  let fitted = size;
  ctx.font = `${weight} ${fitted}px CoverFont, Arial, sans-serif`;
  while (ctx.measureText(value).width > width && fitted > 5) {
    fitted -= 1;
    ctx.font = `${weight} ${fitted}px CoverFont, Arial, sans-serif`;
  }
  ctx.fillText(value, x, y);
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
) {
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
    roundedRect(ctx, photoX, photoY, photoWidth, photoHeight, photoRadius);
    ctx.clip();
    ctx.drawImage(photoCanvas, photoX, photoY);
    ctx.restore();
  } else {
    const placeholder = ctx.createLinearGradient(photoX, photoY, photoX + photoWidth, photoY + photoHeight);
    placeholder.addColorStop(0, "#777777");
    placeholder.addColorStop(1, "#262629");
    ctx.save();
    roundedRect(ctx, photoX, photoY, photoWidth, photoHeight, photoRadius);
    ctx.clip();
    ctx.fillStyle = placeholder;
    ctx.fillRect(photoX, photoY, photoWidth, photoHeight);
    ctx.restore();
  }
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
function spotifyTitle(ctx: CanvasRenderingContext2D, face: { weight: number; family: string }, value: string, box: { x: number; y: number; width: number; height: number }, size: number, align: "left" | "right" | "center", vertical: "top" | "center" | "bottom", maxLines: number, subtitle = "", subtitleSize = 0) {
  const lineHeight = 1.02;
  const measure = (line: string, fontSize: number) => { ctx.font = `${face.weight} ${fontSize}px ${face.family}`; return ctx.measureText(line).width; };
  const fitted = fitTitleBlock(value, subtitle, measure, { size, minSize: 24, maxWidth: box.width, maxHeight: box.height, maxLines, lineHeight, subtitleSize });
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
  if (s.mode === "spotify-this-is") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size / 2);
    ctx.fillStyle = s.bandColor;
    ctx.fillRect(0, size / 2, size, size / 2);
    drawPhoto(ctx, uploaded, s, 240, 250, 720, 720, 0);
    ctx.fillStyle = s.textColor;
    const reserve = s.showLogo && s.corner.startsWith("top") ? 150 : 0;
    // The "THIS IS" heading always uses the wide face, like Spotify's own covers; the font switch only affects the name.
    spotifyTitle(ctx, spotifyFace("wide"), s.spotifyKicker, { x: pad + reserve, y: 58, width: size - (pad + reserve) * 2, height: 178 }, s.spotifyKickerFontSize, "center", "center", 1);
    spotifyTitle(ctx, face, s.spotifyTitle, { x: pad, y: 995, width: size - pad * 2, height: 170 }, s.spotifyFontSize, "center", "center", 1);
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
    spotifyTitle(ctx, face, s.spotifyTitle, { ...logoInset(s.spotifyTitlePosition), y: titleBox.y, height: titleBox.height }, s.spotifyFontSize, align, titleBox.vertical, 2, s.spotifyShowSubtitle ? s.spotifySubtitle : "", s.spotifySubtitleFontSize);
    return;
  }
  // Full photo: the background (photo, gradient, color, or solid) is drawn by renderCover; only the photo is drawn here.
  if (s.spotifyBackgroundType === "picture") drawPhoto(ctx, uploaded, s, 0, 0, size, size, 0);
  ctx.fillStyle = s.textColor;
  const height = size * .45;
  const y = s.spotifyTitlePosition === "top" ? 40 : size - 40 - height;
  spotifyTitle(ctx, face, s.spotifyTitle, { ...logoInset(s.spotifyTitlePosition), y, height }, s.spotifyFontSize, align, s.spotifyTitlePosition, 3, s.spotifyShowSubtitle ? s.spotifySubtitle : "", s.spotifySubtitleFontSize);
}

// Preview and export share this renderer, including crop and pixel-level color treatment.
export async function renderCover(canvas: HTMLCanvasElement, s: CoverSettings, photo: string | null) {
  const size = 1200;
  const spotify = platformOf(s.mode) === "spotify";
  const backgroundType = activeBackground(s.mode, s.backgroundType, s.spotifyBackgroundType);
  const background = backgroundType === "gradients" ? await loadImage(`/assets/gradients/${s.gradient}.png`) : null;
  const uploaded = photo ? await loadImage(photo) : null;
  await Promise.all([document.fonts.load('600 100px CoverFont'), document.fonts.load('300 100px CoverFont'), document.fonts.load('400 100px CoverFont'), ...(spotify ? [document.fonts.load('700 100px CoverFontBold'), document.fonts.load('900 100px CoverFontWide')] : [])]);
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "top";
  if (backgroundType === "custom") {
    const shade = colorShade(s.customColor);
    const fill = ctx.createLinearGradient(0, size, size, 0);
    fill.addColorStop(0, shade.dark);
    fill.addColorStop(.5, shade.base);
    fill.addColorStop(1, shade.light);
    ctx.fillStyle = fill;
  } else {
    ctx.fillStyle = s.customColor;
  }
  ctx.fillRect(0, 0, size, size);
  if (background) ctx.drawImage(background, 0, 0, size, size);
  const band = Math.round(size * s.bandHeight / 100);
  if (spotify) {
    renderSpotify(ctx, s, uploaded, size);
  } else if (s.mode === "essentials") {
    const inset = Math.round(size * s.photoMargin / 100);
    const photoX = inset;
    const photoY = band + (s.photoTopMargin ? inset : 0);
    const photoWidth = size - inset * 2;
    const photoHeight = size - photoY - inset;
    const photoRadius = Math.round(size * s.photoRadius / 100);
    ctx.fillStyle = s.bandColor;
    ctx.fillRect(0, 0, size, size);
    drawPhoto(ctx, uploaded, s, photoX, photoY, photoWidth, photoHeight, photoRadius);
    ctx.fillStyle = s.bandColor;
    ctx.fillRect(0, 0, size, band);
    ctx.fillStyle = s.textColor;
    text(ctx, s.essentialsTitle, 48, Math.max(28, band - s.essentialsFontSize - 20), s.essentialsFontSize, 600, 1104);
  } else {
    if (s.backgroundType === "picture") {
      drawPhoto(ctx, uploaded, s, 0, 0, size, size, 0);
    }
    ctx.fillStyle = s.textColor;
    ctx.textAlign = s.classicAlign;
    const classicX = s.classicAlign === "center" ? size / 2 : 100;
    const maxTitleY = Math.max(15, Math.floor((900 - s.classicFontSize - s.classicSubtitleFontSize) / 12));
    const titleY = Math.round(size * Math.min(s.classicTitleY, maxTitleY) / 100);
    text(ctx, s.title, classicX, titleY, s.classicFontSize, s.classicTitleWeight === "bold" ? 600 : 300, 1000);
    text(ctx, s.subtitle, classicX, titleY + s.classicFontSize, s.classicSubtitleFontSize, s.classicSubtitleWeight === "bold" ? 600 : 300, 1000);
    ctx.textAlign = "left";
    ctx.globalAlpha = .65;
    text(ctx, s.footer, 100, s.showLogo && s.corner.startsWith("bottom") ? 954 : 1060, 60, 400, 1000);
    ctx.globalAlpha = 1;
  }
  if (s.showLogo && spotify) {
    const d = 104;
    // In Band, a framed photo moves the logo into the photo's corner instead of the cover's.
    const area = s.mode === "spotify-band"
      ? bandLogoArea(size, band, s.spotifyTitlePosition, s.corner, s.photoMargin, s.photoTopMargin)
      : { x: 0, y: 0, width: size, height: size };
    const { x, y } = cornerPosition(s.corner, d, d, area, 48);
    drawSpotifyLogo(ctx, x, y, d, logoColor(s.mode, s.textColor, s.bandColor, s.logoMatchesBand));
  } else if (s.showLogo) {
    const framedPhoto = s.mode === "essentials" && (s.photoMargin > 0 || s.photoRadius > 0);
    const logoCorner = framedPhoto && s.corner.startsWith("bottom")
      ? (s.corner === "bottom-left" ? "top-left" : "top-right")
      : s.corner;
    const logo = appleLogoShape(s.appleLogo);
    const w = s.mode === "essentials" ? 260 : 240;
    const h = w * logo.height / logo.width;
    const padding = s.mode === "essentials" ? 48 : 100;
    const x = logoCorner.endsWith("right") ? size - padding - w : padding;
    const y = logoCorner.startsWith("bottom") ? size - 48 - h : 48;
    ctx.save(); ctx.translate(x, y); ctx.scale(w / logo.width, h / logo.height);
    ctx.fillStyle = s.textColor; ctx.fill(new Path2D(logo.path)); ctx.restore();
  }
}
