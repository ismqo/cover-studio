import { APPLE_MUSIC_PATH } from "./apple-logo";

export type CoverSettings = {
  mode: "classic" | "essentials";
  title: string; subtitle: string; footer: string; essentialsTitle: string;
  classicAlign: "left" | "center"; classicTitleY: number;
  classicFontSize: number; classicSubtitleFontSize: number;
  classicTitleWeight: "normal" | "bold"; classicSubtitleWeight: "normal" | "bold";
  showLogo: boolean; corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  backgroundType: "gradients" | "colors" | "custom" | "picture";
  gradient: number; color: number; customColor: string;
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
  essentialsTitle: "Essentials", showLogo: true, corner: "top-left",
  backgroundType: "gradients", gradient: 0, color: 0, customColor: "#7865a8",
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

// Preview and export share this renderer, including crop and pixel-level color treatment.
export async function renderCover(canvas: HTMLCanvasElement, s: CoverSettings, photo: string | null) {
  const size = 1200;
  const background = s.mode === "essentials" || s.backgroundType === "custom" || s.backgroundType === "picture" ? null : await loadImage(`/assets/${s.backgroundType}/${s.backgroundType === "gradients" ? s.gradient : s.color}.png`);
  const uploaded = photo ? await loadImage(photo) : null;
  await Promise.all([document.fonts.load('600 100px CoverFont'), document.fonts.load('300 100px CoverFont'), document.fonts.load('400 100px CoverFont')]);
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "top";
  ctx.fillStyle = s.customColor;
  ctx.fillRect(0, 0, size, size);
  if (background) ctx.drawImage(background, 0, 0, size, size);
  const band = Math.round(size * s.bandHeight / 100);
  if (s.mode === "essentials") {
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
  if (s.showLogo) {
    const framedPhoto = s.mode === "essentials" && (s.photoMargin > 0 || s.photoRadius > 0);
    const logoCorner = framedPhoto && s.corner.startsWith("bottom")
      ? (s.corner === "bottom-left" ? "top-left" : "top-right")
      : s.corner;
    const w = s.mode === "essentials" ? 260 : 240;
    const h = w * 20.7 / 84.3;
    const padding = s.mode === "essentials" ? 48 : 100;
    const x = logoCorner.endsWith("right") ? size - padding - w : padding;
    const y = logoCorner.startsWith("bottom") ? size - 48 - h : 48;
    ctx.save(); ctx.translate(x, y); ctx.scale(w / 84.3, h / 20.7);
    ctx.fillStyle = s.textColor; ctx.fill(new Path2D(APPLE_MUSIC_PATH)); ctx.restore();
  }
}
