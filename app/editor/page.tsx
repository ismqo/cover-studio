"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { ArrowDownToLine, Check, ImagePlus, Music2, RotateCcw, X } from "lucide-react";
import { NavMenu } from "@/components/nav-menu";
import { DragToggle, DraggableSegments } from "@/components/drag-switch";
import { SmoothRange } from "@/components/smooth-range";
import { useI18n } from "@/components/locale-provider";
import { CoverSettings, defaults, loadImage, releaseImage, renderCover } from "@/lib/render-cover";
import { localizeCoverSamples, type Dictionary, type NoticeKey } from "@/lib/i18n";

const corners = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
const tintColors = ["#e8e8ed", "#efa1ad", "#8bc8b3", "#e9bb75", "#8ebde7", "#ffffff"];

export default function Home() {
  const { t, locale } = useI18n();
  const copy = t.editor;
  const notice = (key: string) => copy.errors[key as NoticeKey] ?? key;
  const [settings, setSettings] = useState<CoverSettings>(defaults);

  useEffect(() => {
    setSettings(current => localizeCoverSamples(current, locale));
  }, [locale]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [exporting, setExporting] = useState(false);
  const [rendering, setRendering] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [handoff, setHandoff] = useState<DownloadHandoff | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadId = useRef(0);
  const essentials = settings.mode === "essentials";
  const bottomLogoUnavailable = essentials && (settings.photoMargin > 0 || settings.photoRadius > 0);
  const bandHeightMin = settings.corner.startsWith("bottom") ? Math.max(18, Math.ceil((settings.essentialsFontSize + 40) / 12)) : 27;
  const classicTitleYMax = Math.max(15, Math.floor((900 - settings.classicFontSize - settings.classicSubtitleFontSize) / 12));
  const update = <K extends keyof CoverSettings>(key: K, value: CoverSettings[K]) => {
    setSettings(s => ({ ...s, [key]: value })); setStatus("");
  };
  const updatePhotoFrame = (key: "photoMargin" | "photoRadius", value: number) => {
    setSettings(s => ({
      ...s,
      [key]: value,
      corner: value > 0 && s.corner.startsWith("bottom") ? (s.corner === "bottom-left" ? "top-left" : "top-right") : s.corner,
    }));
    setStatus("");
  };
  const photoFrameChanged = settings.photoMargin !== defaults.photoMargin || settings.photoTopMargin !== defaults.photoTopMargin || settings.photoRadius !== defaults.photoRadius;
  const resetPhotoFrame = () => {
    setSettings(s => ({ ...s, photoMargin: defaults.photoMargin, photoTopMargin: defaults.photoTopMargin, photoRadius: defaults.photoRadius }));
    setStatus("");
  };
  const updateClassicFontSize = (key: "classicFontSize" | "classicSubtitleFontSize", value: number) => {
    setSettings(s => {
      const totalSize = key === "classicFontSize" ? value + s.classicSubtitleFontSize : s.classicFontSize + value;
      const maxTitleY = Math.max(15, Math.floor((900 - totalSize) / 12));
      return { ...s, [key]: value, classicTitleY: Math.min(s.classicTitleY, maxTitleY) };
    });
    setStatus("");
  };

  useEffect(() => {
    let cancelled = false;
    setRendering(true);
    const buffer = document.createElement("canvas");
    renderCover(buffer, settings, photo).then(() => {
      if (!cancelled && canvas.current) {
        canvas.current.width = canvas.current.height = 1200;
        canvas.current.getContext("2d")!.drawImage(buffer, 0, 0);
        setRendering(false);
      }
    }).catch((e: Error) => { if (!cancelled) { setError(e.message); setRendering(false); } });
    return () => { cancelled = true; };
  }, [settings, photo]);

  useEffect(() => {
    if (bottomLogoUnavailable && settings.corner.startsWith("bottom")) {
      setSettings(s => ({ ...s, corner: s.corner === "bottom-left" ? "top-left" : "top-right" }));
    }
  }, [bottomLogoUnavailable, settings.corner]);

  useEffect(() => () => { if (photo) releaseImage(photo); }, [photo]);

  async function upload(file?: File) {
    if (!file) return;
    const id = ++uploadId.current;
    setError(""); setStatus("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("fileType"); return; }
    if (file.size > 20 * 1024 * 1024) { setError("fileSize"); return; }
    setUploading(true);
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      if (image.width * image.height > 60_000_000) throw new Error("photoTooLarge");
      if (id !== uploadId.current) { releaseImage(url); return; }
      setPhoto(url); setPhotoName(file.name);
      setSettings(s => ({ ...s, zoom: 1, offsetX: 50, offsetY: 50 }));
    } catch (e) { releaseImage(url); if (id === uploadId.current) setError((e as Error).message); }
    finally { if (id === uploadId.current) setUploading(false); }
  }

  async function download() {
    setExporting(true); setError("");
    try {
      const output = document.createElement("canvas");
      await renderCover(output, settings, photo);
      const blob = await new Promise<Blob>((resolve, reject) => output.toBlob(b => b ? resolve(b) : reject(new Error("exportFailed")), "image/png"));
      const url = URL.createObjectURL(blob);
      const filename = `cover-${essentials ? settings.essentialsTitle : settings.title}`.replace(/[^a-z0-9-]/gi, "-").slice(0, 100) + ".png";
      const rect = canvas.current?.getBoundingClientRect();
      const size = Math.min(window.innerWidth * 0.68, window.innerHeight * 0.52, 360);
      const peekOffset = window.innerWidth <= 650 ? size * 0.12 : 0;
      setHandoff({
        url,
        filename,
        size,
        x: rect ? rect.left + rect.width / 2 - window.innerWidth / 2 + peekOffset : peekOffset,
        y: rect ? rect.top + rect.height / 2 - window.innerHeight / 2 : 0,
        scale: rect && size ? rect.width / size : 1,
        leaving: false,
      });
    } catch (e) { setError((e as Error).message); }
    finally { setExporting(false); }
  }

  useEffect(() => {
    if (!handoff || handoff.leaving) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = window.setTimeout(() => {
      setHandoff(current => current && !current.leaving ? { ...current, leaving: true } : current);
    }, reduced ? 900 : 3200);
    return () => clearTimeout(hold);
  }, [handoff]);

  useEffect(() => {
    if (!handoff?.leaving) return;
    const { url, filename } = handoff;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const done = window.setTimeout(() => {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      setHandoff(current => current?.url === url ? null : current);
    }, reduced ? 200 : 1320);
    return () => clearTimeout(done);
  }, [handoff?.leaving, handoff?.url, handoff?.filename]);

  function reset() {
    uploadId.current++; setUploading(false); setSettings(localizeCoverSamples(defaults, locale)); setPhoto(null); setPhotoName(""); setError(""); setStatus("reset");
  }

  useEffect(() => {
    if (document.documentElement.dataset.enter !== "editor") return;
    const timer = window.setTimeout(() => {
      delete document.documentElement.dataset.enter;
      document.documentElement.style.background = "";
      document.body.style.background = "";
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  return <>
  <div className="app-shell">
    <header className="app-header">
      <nav className="editor-nav liquid-nav" aria-label={t.nav.main}>
      <a href="/" className="brand" aria-label={t.nav.home}>Cover<span className="studio-label">STUDIO</span></a>
      <div className="editor-nav-actions">
        <NavMenu />
      </div>
      </nav>
    </header>

    <main>
      <div className="workspace">
        <div className="preview-column">
        <section className="preview-panel" aria-label={copy.coverPreview}>
          <div className="section-top"><span><span className="live-dot"/> {copy.livePreview}</span><div className="preview-actions"><button className="icon-button" onClick={reset} title={copy.resetCover} aria-label={copy.resetCover}><RotateCcw size={15}/></button></div></div>
          <div className="preview-stage"><canvas ref={canvas} width="1200" height="1200" aria-label={copy.coverPreviewNamed(essentials ? settings.essentialsTitle : settings.title)} role="img"/></div>
          <button className="download mobile-preview-download" onClick={download} disabled={exporting || rendering || uploading || !!handoff} aria-label={exporting ? copy.exporting : copy.download} title={exporting ? copy.exporting : copy.download}><ArrowDownToLine size={16}/><span>{exporting ? copy.exporting : copy.download}</span></button>
          <div className="preview-download"><button className="download" onClick={download} disabled={exporting || rendering || uploading || !!handoff}><ArrowDownToLine size={16}/>{exporting ? copy.exporting : copy.download}</button></div>
        </section>
        <p className="preview-credit">{copy.caption}</p>
        </div>

        <section className="controls" aria-label={copy.coverSettings} tabIndex={0}>
          <div className="control-section first-section"><div className="section-heading"><h2>{copy.coverStyle}</h2></div>
            <div className="style-options">
              <button className={`style-option ${!essentials ? "selected" : ""}`} aria-pressed={!essentials} onClick={() => setSettings(s => ({ ...s, mode: "classic", textColor: "#ffffff" }))}><span className="style-thumb classic-thumb" aria-hidden="true">Aa</span><span><strong>{copy.original}</strong><small>{copy.originalHint}</small></span></button>
              <button className={`style-option ${essentials ? "selected" : ""}`} aria-pressed={essentials} onClick={() => setSettings(s => ({ ...s, mode: "essentials", corner: "top-right", textColor: "#111111", treatment: "original" }))}><span className="style-thumb essentials-thumb" aria-hidden="true"><span>Essentials</span><Music2 size={19}/></span><span><strong>{copy.essentials}</strong><small>{copy.essentialsHint}</small></span></button>
            </div>
          </div>

          <div className="control-section"><div className="section-heading"><h2>{essentials ? copy.titleBand : copy.typography}</h2></div>
            {essentials ? <label className="field">{copy.title}<input maxLength={100} value={settings.essentialsTitle} onChange={e => update("essentialsTitle", e.target.value)} placeholder={copy.sampleEssentials}/></label> : <><div className="fields"><label className="field">{copy.bigTitle}<input maxLength={100} value={settings.title} onChange={e => update("title", e.target.value)} placeholder={copy.sampleTitle}/></label><label className="range-label title-size-range">{copy.bigTitleSize}<span>{settings.classicFontSize}px</span><SmoothRange min="96" max="216" step="1" value={settings.classicFontSize} onValueChange={value => updateClassicFontSize("classicFontSize", value)}/></label><div className="field-label weight-label">{copy.bigTitleWeight}</div><DraggableSegments className="segmented weight-options">{([['normal', copy.normal],['bold', copy.bold]] as const).map(([value,label]) => <button key={value} className={settings.classicTitleWeight === value ? "active" : ""} aria-pressed={settings.classicTitleWeight === value} onClick={() => update("classicTitleWeight", value)}>{label}</button>)}</DraggableSegments><label className="field">{copy.subtitle}<input maxLength={100} value={settings.subtitle} onChange={e => update("subtitle", e.target.value)} placeholder={copy.sampleSubtitle}/></label><label className="range-label title-size-range">{copy.subtitleSize}<span>{settings.classicSubtitleFontSize}px</span><SmoothRange min="72" max="180" step="1" value={settings.classicSubtitleFontSize} onValueChange={value => updateClassicFontSize("classicSubtitleFontSize", value)}/></label><div className="field-label weight-label">{copy.subtitleWeight}</div><DraggableSegments className="segmented weight-options">{([['normal', copy.normal],['bold', copy.bold]] as const).map(([value,label]) => <button key={value} className={settings.classicSubtitleWeight === value ? "active" : ""} aria-pressed={settings.classicSubtitleWeight === value} onClick={() => update("classicSubtitleWeight", value)}>{label}</button>)}</DraggableSegments><label className="field">{copy.footer}<input maxLength={150} value={settings.footer} onChange={e => update("footer", e.target.value)} placeholder={copy.sampleFooter}/></label></div><div className="field-label">{copy.titleAlignment}</div><DraggableSegments className="segmented typography-alignment">{([['left', copy.left],['center', copy.center]] as const).map(([value,label]) => <button key={value} className={settings.classicAlign === value ? "active" : ""} aria-pressed={settings.classicAlign === value} onClick={() => update("classicAlign", value)}>{label}</button>)}</DraggableSegments><label className="range-label">{copy.titlePosition}<span>{settings.classicTitleY}%</span><SmoothRange min="15" max={classicTitleYMax} value={settings.classicTitleY} onValueChange={value => update("classicTitleY", value)}/></label></>}
            <div className="color-row"><label className="color-control"><input type="color" value={settings.textColor} onChange={e => update("textColor", e.target.value)}/><span>{copy.textAndLogo}</span></label>{essentials && <label className="color-control"><input type="color" value={settings.bandColor} onChange={e => update("bandColor", e.target.value)}/><span>{copy.bandColor}</span></label>}</div>
            {essentials && <><label className="range-label">{copy.titleSize}<span>{settings.essentialsFontSize}px</span><SmoothRange min="72" max="180" step="2" value={settings.essentialsFontSize} onValueChange={value => { const fontSize = value; setSettings(s => ({ ...s, essentialsFontSize: fontSize, bandHeight: Math.max(s.bandHeight, s.corner.startsWith("bottom") ? Math.max(18, Math.ceil((fontSize + 40) / 12)) : 27) })); }}/></label><label className="range-label">{copy.bandHeight}<span>{settings.bandHeight}%</span><SmoothRange min={bandHeightMin} max="42" value={settings.bandHeight} onValueChange={value => update("bandHeight", value)}/></label></>}
          </div>

          {essentials && <div className="control-section"><div className="section-heading"><h2>{copy.yourPhoto}</h2></div>
            <PhotoControls copy={copy} photo={photo} photoName={photoName} uploading={uploading} dragging={dragging} setDragging={setDragging} fileInput={fileInput} upload={upload} onRemove={() => { uploadId.current++; setUploading(false); setPhoto(null); setPhotoName(""); }} settings={settings} update={update} updatePhotoFrame={updatePhotoFrame} photoFrameChanged={photoFrameChanged} resetPhotoFrame={resetPhotoFrame}/>
          </div>}

          {!essentials && <div className="control-section"><div className="section-heading"><h2>{copy.background}</h2></div><DraggableSegments className="segmented">{([['gradients', copy.gradient],['colors', copy.color],['custom', copy.custom],['picture', copy.picture]] as const).map(([value,label]) => <button key={value} className={settings.backgroundType === value ? "active" : ""} aria-pressed={settings.backgroundType === value} onClick={() => update("backgroundType", value)}>{label}</button>)}</DraggableSegments>
            {settings.backgroundType === "picture" ? <PhotoControls copy={copy} photo={photo} photoName={photoName} uploading={uploading} dragging={dragging} setDragging={setDragging} fileInput={fileInput} upload={upload} onRemove={() => { uploadId.current++; setUploading(false); setPhoto(null); setPhotoName(""); }} settings={settings} update={update} showPhotoFrame={false}/> : settings.backgroundType === "custom" ? <label className="color-control custom-background"><input type="color" value={settings.customColor} onChange={e => update("customColor", e.target.value)}/><span>{copy.backgroundColor}</span><code>{settings.customColor}</code></label> : <div className="swatches">{Array.from({ length: settings.backgroundType === "gradients" ? 40 : 7 }, (_, i) => { const name = settings.backgroundType === "gradients" ? copy.gradientN(i + 1) : copy.colorN(i + 1); return <button key={`${settings.backgroundType}-${i}`} title={name} aria-label={name} aria-pressed={(settings.backgroundType === "gradients" ? settings.gradient : settings.color) === i} className={`swatch ${(settings.backgroundType === "gradients" ? settings.gradient : settings.color) === i ? "selected" : ""}`} onClick={() => update(settings.backgroundType === "gradients" ? "gradient" : "color", i)}><img src={`/assets/${settings.backgroundType}/${i}.png`} alt=""/>{(settings.backgroundType === "gradients" ? settings.gradient : settings.color) === i && <Check size={15}/>}</button>; })}</div>}
          </div>}

          <div className="control-section last-section"><div className="section-heading"><h2>{copy.appleLogo}</h2></div><label className="toggle-row"><span>{copy.showLogo}</span><DragToggle checked={settings.showLogo} onChange={value => update("showLogo", value)}/></label>
            <div className={`corner-options ${!settings.showLogo ? "disabled" : ""}`}>{corners.map(corner => { const disabled = !settings.showLogo || (bottomLogoUnavailable && corner.startsWith("bottom")); return <button disabled={disabled} key={corner} className={settings.corner === corner ? "active" : ""} aria-pressed={settings.corner === corner} title={disabled && settings.showLogo ? copy.bottomCornerHint : undefined} onClick={() => setSettings(s => ({ ...s, corner, bandHeight: essentials && corner.startsWith("top") ? Math.max(s.bandHeight, 27) : s.bandHeight }))}><span className={`corner-icon ${corner}`}><i/></span>{copy.corners[corner]}</button>; })}</div>
            {bottomLogoUnavailable && <p className="help-text">{copy.bottomCornerHelp}</p>}
          </div>
        </section>
      </div>
      {(error || status) && <div className={`toast ${error ? "error" : ""}`} role={error ? "alert" : "status"}>{notice(error || status)}<button aria-label={copy.dismiss} onClick={() => { setError(""); setStatus(""); }}><X size={15}/></button></div>}
    </main>
  </div>
  {handoff && <div className={`download-reveal${handoff.leaving ? " is-leaving" : ""}`} role="status" aria-live="polite">
    <div className="download-anchor" style={{ "--case-size": `${handoff.size}px`, "--from-x": `${handoff.x}px`, "--from-y": `${handoff.y}px`, "--from-scale": handoff.scale } as CSSProperties}>
      <div className="download-case">
        <div className="download-cd" aria-hidden="true"/>
        <img className="download-cover" src={handoff.url} alt=""/>
      </div>
      <p className="download-caption">{copy.thereYouGo}</p>
    </div>
  </div>}
  </>;
}

type DownloadHandoff = { url: string; filename: string; size: number; x: number; y: number; scale: number; leaving: boolean };

function PhotoControls({
  copy, photo, photoName, uploading, dragging, setDragging, fileInput, upload, onRemove, settings, update, updatePhotoFrame, photoFrameChanged, resetPhotoFrame, showPhotoFrame = true,
}: {
  copy: Dictionary["editor"];
  photo: string | null;
  photoName: string;
  uploading: boolean;
  dragging: boolean;
  setDragging: (value: boolean) => void;
  fileInput: RefObject<HTMLInputElement | null>;
  upload: (file?: File) => Promise<void>;
  onRemove: () => void;
  settings: CoverSettings;
  update: <K extends keyof CoverSettings>(key: K, value: CoverSettings[K]) => void;
  updatePhotoFrame?: (key: "photoMargin" | "photoRadius", value: number) => void;
  photoFrameChanged?: boolean;
  resetPhotoFrame?: () => void;
  showPhotoFrame?: boolean;
}) {
  return <>
    <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden-input" aria-label={copy.uploadPhoto} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }}/>
    <button className={`upload-zone ${dragging ? "dragging" : ""}`} onClick={() => fileInput.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files[0]); }}><ImagePlus size={23}/><strong>{uploading ? copy.openingPhoto : photo ? copy.replacePhoto : copy.addPhoto}</strong><span>{copy.dropPhoto}</span><small>{copy.photoTypes}</small></button>
    {photo && <div className="file-row"><span>{photoName}</span><button className="icon-button" aria-label={copy.removePhoto} onClick={onRemove}><X size={14}/></button></div>}
    {photo ? <>
    {showPhotoFrame && updatePhotoFrame && resetPhotoFrame && <div className="photo-frame-controls"><div className="field-label">{copy.photoFrame}<button className="icon-button" title={copy.resetPhotoFrame} aria-label={copy.resetPhotoFrame} disabled={!photoFrameChanged} onClick={resetPhotoFrame}><RotateCcw size={14}/></button></div><label className="range-label">{copy.sideMargin}<span>{settings.photoMargin}%</span><SmoothRange min="0" max="12" step="1" value={settings.photoMargin} onValueChange={value => updatePhotoFrame("photoMargin", value)}/></label><label className="toggle-row compact frame-toggle"><span>{copy.includeTopMargin}</span><DragToggle checked={settings.photoTopMargin} onChange={value => update("photoTopMargin", value)}/></label><label className="range-label">{copy.roundedCorners}<span>{settings.photoRadius}%</span><SmoothRange min="0" max="10" step="1" value={settings.photoRadius} onValueChange={value => updatePhotoFrame("photoRadius", value)}/></label></div>}
    <div className="field-label photo-treatment-label">{copy.photoTreatment}<button className="icon-button" title={copy.resetPhotoTreatment} aria-label={copy.resetPhotoTreatment} disabled={settings.brightness === defaults.brightness && settings.contrast === defaults.contrast} onClick={() => { update("brightness", defaults.brightness); update("contrast", defaults.contrast); }}><RotateCcw size={14}/></button></div><DraggableSegments className="segmented treatments">{([['original', copy.originalTreatment],['mono', copy.mono],['duotone', copy.duotone]] as const).map(([value,label]) => <button key={value} aria-pressed={settings.treatment === value} className={settings.treatment === value ? "active" : ""} onClick={() => update("treatment", value)}>{label}</button>)}</DraggableSegments>
    {settings.treatment === "duotone" && <div className="tint-row">{tintColors.map(color => <button key={color} className={`tint ${settings.tint === color ? "active" : ""}`} style={{ background: color }} aria-label={copy.duotoneColor(color)} aria-pressed={settings.tint === color} onClick={() => update("tint", color)}/>)}<label className="custom-tint"><input aria-label={copy.customDuotone} type="color" value={settings.tint} onChange={e => update("tint", e.target.value)}/></label></div>}
    <div className="photo-tone-controls"><label className="range-label">{copy.brightness}<span>{settings.brightness > 0 ? `+${settings.brightness}` : settings.brightness}</span><SmoothRange min="-100" max="100" step="1" value={settings.brightness} onValueChange={value => update("brightness", value)}/></label><label className="range-label">{copy.contrast}<span>{settings.contrast > 0 ? `+${settings.contrast}` : settings.contrast}</span><SmoothRange min="-100" max="100" step="1" value={settings.contrast} onValueChange={value => update("contrast", value)}/></label></div>
    <div className="crop-controls"><label className="range-label">{copy.zoom}<span>{settings.zoom.toFixed(1)}×</span><SmoothRange min="1" max="3" step="0.05" value={settings.zoom} onValueChange={value => update("zoom", value)}/></label><label className="range-label">{copy.horizontal}<span>{settings.offsetX}%</span><SmoothRange min="0" max="100" value={settings.offsetX} onValueChange={value => update("offsetX", value)}/></label><label className="range-label">{copy.vertical}<span>{settings.offsetY}%</span><SmoothRange min="0" max="100" value={settings.offsetY} onValueChange={value => update("offsetY", value)}/></label></div>
    </> : <p className="help-text">{copy.photoHelp}</p>}
  </>;
}
