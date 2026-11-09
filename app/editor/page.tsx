"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { ArrowDownToLine, Check, ImagePlus, Music2, RotateCcw, X } from "lucide-react";
import { NavMenu } from "@/components/nav-menu";
import { DragToggle, DraggableSegments } from "@/components/drag-switch";
import { SmoothRange } from "@/components/smooth-range";
import { useI18n } from "@/components/locale-provider";
import { CoverSettings, defaults, loadImage, releaseImage, renderCover } from "@/lib/render-cover";
import { localizeCoverSamples, type Dictionary, type NoticeKey } from "@/lib/i18n";
import { APPLE_MUSIC_PICKER_PATH, APPLE_MUSIC_PICKER_VIEWBOX, appleLogoShape } from "@/lib/apple-logo";
import { BASIC_COLORS, findPreset } from "@/lib/color-presets";
import { treatmentChanged, treatmentDefaults } from "@/lib/cover-layout";
import { platformModes, platformOf, styleDefaults, type CoverMode, type Platform } from "@/lib/cover-layout";

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
  const classic = settings.mode === "classic";
  const platform = platformOf(settings.mode);
  const spotify = platform === "spotify";
  const band = settings.mode === "spotify-band";
  const thisIs = settings.mode === "spotify-this-is";
  const hasSubtitle = band || settings.mode === "spotify-photo";
  const showSpotifySubtitle = hasSubtitle && settings.spotifyShowSubtitle;
  const fullPhoto = settings.mode === "spotify-photo";
  // Original and Full photo each keep their own background choice.
  const backgroundKey = fullPhoto ? "spotifyBackgroundType" : "backgroundType";
  const backgroundType = settings[backgroundKey];
  const displayTitle = spotify ? settings.spotifyTitle : essentials ? settings.essentialsTitle : settings.title;
  const selectMode = (mode: CoverMode) => { setSettings(s => ({ ...s, mode, ...styleDefaults(mode) })); setStatus(""); };
  const selectPlatform = (next: Platform) => { if (next !== platform) selectMode(platformModes[next][0]); };
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
      corner: value > 0 && s.mode === "essentials" && s.corner.startsWith("bottom") ? (s.corner === "bottom-left" ? "top-left" : "top-right") : s.corner,
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
      const filename = `cover-${displayTitle}`.replace(/[^a-z0-9-]/gi, "-").slice(0, 100) + ".png";
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
          <div className="preview-stage"><canvas ref={canvas} width="1200" height="1200" aria-label={copy.coverPreviewNamed(displayTitle)} role="img"/></div>
          <button className="download mobile-preview-download" onClick={download} disabled={exporting || rendering || uploading || !!handoff} aria-label={exporting ? copy.exporting : copy.download} title={exporting ? copy.exporting : copy.download}><ArrowDownToLine size={16}/><span>{exporting ? copy.exporting : copy.download}</span></button>
          <div className="preview-download"><button className="download" onClick={download} disabled={exporting || rendering || uploading || !!handoff}><ArrowDownToLine size={16}/>{exporting ? copy.exporting : copy.download}</button></div>
        </section>
        <p className="preview-credit">{copy.caption}</p>
        </div>

        <section className="controls" aria-label={copy.coverSettings} tabIndex={0}>
          <div className="control-section first-section"><div className="section-heading"><h2>{copy.platform}</h2></div>
            <div className="style-options">
              {(["apple", "spotify"] as const).map(value => <button key={value} className={`style-option ${platform === value ? "selected" : ""}`} aria-pressed={platform === value} aria-label={value === "apple" ? copy.appleMusic : copy.spotify} title={value === "apple" ? copy.appleMusic : copy.spotify} onClick={() => selectPlatform(value)}><span className={`platform-logo ${value}-logo`} aria-hidden="true">{value === "apple" ? <svg viewBox={`0 0 ${APPLE_MUSIC_PICKER_VIEWBOX.width} ${APPLE_MUSIC_PICKER_VIEWBOX.height}`}><path d={APPLE_MUSIC_PICKER_PATH}/></svg> : <i/>}</span></button>)}
            </div>
          </div>

          <div className="control-section first-section"><div className="section-heading"><h2>{copy.coverStyle}</h2></div>
            <div className={`style-options ${spotify ? "three-up" : ""}`}>
              {platformModes[platform].map(mode => <button key={mode} className={`style-option ${settings.mode === mode ? "selected" : ""}`} aria-pressed={settings.mode === mode} onClick={() => selectMode(mode)}><StyleThumb mode={mode}/><span><strong>{styleCopy(copy, mode)[0]}</strong><small>{styleCopy(copy, mode)[1]}</small></span></button>)}
            </div>
          </div>

          {/* 1. Text: what the cover says. */}
          <Section title={copy.textContent}>
            {thisIs && <TextField label={copy.kicker} maxLength={40} value={settings.spotifyKicker} onChange={value => update("spotifyKicker", value)}/>}
            {hasSubtitle && <SegmentField label={copy.content} value={settings.spotifyShowSubtitle} options={[[false, copy.titleOnly], [true, copy.titleAndSubtitle]]} onChange={value => update("spotifyShowSubtitle", value)}/>}
            {spotify && <TextField label={copy.title} value={settings.spotifyTitle} placeholder={copy.sampleTitle} onChange={value => update("spotifyTitle", value)}/>}
            {showSpotifySubtitle && <TextField label={copy.subtitle} value={settings.spotifySubtitle} placeholder={copy.sampleSubtitle} onChange={value => update("spotifySubtitle", value)}/>}
            {essentials && <TextField label={copy.title} value={settings.essentialsTitle} placeholder={copy.sampleEssentials} onChange={value => update("essentialsTitle", value)}/>}
            {classic && <>
              <TextField label={copy.bigTitle} value={settings.title} placeholder={copy.sampleTitle} onChange={value => update("title", value)}/>
              <TextField label={copy.subtitle} value={settings.subtitle} placeholder={copy.sampleSubtitle} onChange={value => update("subtitle", value)}/>
              <TextField label={copy.footer} maxLength={150} value={settings.footer} placeholder={copy.sampleFooter} onChange={value => update("footer", value)}/>
            </>}
          </Section>

          {/* 2. Typography: how the text looks, in reading order. */}
          <Section title={copy.typography}>
            {spotify && <SegmentField label={copy.titleFont} value={settings.spotifyFont} options={[["standard", copy.fontStandard], ["wide", copy.fontWide]]} optionClass={value => `font-${value}`} className="font-options" onChange={value => update("spotifyFont", value)}/>}
            {thisIs && <RangeField label={copy.kickerSize} unit="px" min="72" max="168" step="2" value={settings.spotifyKickerFontSize} onChange={value => update("spotifyKickerFontSize", value)}/>}
            {spotify && <RangeField label={copy.titleSize} unit="px" min="72" max="240" step="2" value={settings.spotifyFontSize} onChange={value => update("spotifyFontSize", value)}/>}
            {showSpotifySubtitle && <RangeField label={copy.subtitleSize} unit="px" min="32" max="140" step="2" value={settings.spotifySubtitleFontSize} onChange={value => update("spotifySubtitleFontSize", value)}/>}
            {essentials && <RangeField label={copy.titleSize} unit="px" min="72" max="180" step="2" value={settings.essentialsFontSize} onChange={fontSize => setSettings(s => ({ ...s, essentialsFontSize: fontSize, bandHeight: Math.max(s.bandHeight, s.corner.startsWith("bottom") ? Math.max(18, Math.ceil((fontSize + 40) / 12)) : 27) }))}/>}
            {classic && <>
              <RangeField label={copy.bigTitleSize} unit="px" min="96" max="216" step="1" value={settings.classicFontSize} onChange={value => updateClassicFontSize("classicFontSize", value)}/>
              <SegmentField label={copy.bigTitleWeight} value={settings.classicTitleWeight} options={[["normal", copy.normal], ["bold", copy.bold]]} onChange={value => update("classicTitleWeight", value)}/>
              <RangeField label={copy.subtitleSize} unit="px" min="72" max="180" step="1" value={settings.classicSubtitleFontSize} onChange={value => updateClassicFontSize("classicSubtitleFontSize", value)}/>
              <SegmentField label={copy.subtitleWeight} value={settings.classicSubtitleWeight} options={[["normal", copy.normal], ["bold", copy.bold]]} onChange={value => update("classicSubtitleWeight", value)}/>
            </>}
          </Section>

          {/* 3. Layout: where things sit. */}
          {!thisIs && <Section title={copy.layout}>
            {spotify && <>
              <SegmentField label={band ? copy.bandPosition : copy.titlePlacement} value={settings.spotifyTitlePosition} options={[["top", copy.top], ["bottom", copy.bottom]]} onChange={value => update("spotifyTitlePosition", value)}/>
              <SegmentField label={copy.titleAlignment} value={settings.spotifyAlign} options={[["left", copy.left], ["right", copy.right]]} onChange={value => update("spotifyAlign", value)}/>
            </>}
            {classic && <>
              <SegmentField label={copy.titleAlignment} value={settings.classicAlign} options={[["left", copy.left], ["center", copy.center]]} onChange={value => update("classicAlign", value)}/>
              <RangeField label={copy.titlePosition} unit="%" min="15" max={classicTitleYMax} value={settings.classicTitleY} onChange={value => update("classicTitleY", value)}/>
            </>}
            {band && <RangeField label={copy.bandHeight} unit="%" min="15" max="50" value={settings.bandHeight} onChange={value => update("bandHeight", value)}/>}
            {essentials && <RangeField label={copy.bandHeight} unit="%" min={bandHeightMin} max="42" value={settings.bandHeight} onChange={value => update("bandHeight", value)}/>}
          </Section>}

          {/* 4. Colors. */}
          <Section title={copy.colors}>
            <ColorField copy={copy} label={copy.textAndLogo} value={settings.textColor} onChange={value => update("textColor", value)}/>
            {band && settings.showLogo && <label className="toggle-row"><span>{copy.logoMatchesBand}</span><DragToggle checked={settings.logoMatchesBand} onChange={value => update("logoMatchesBand", value)}/></label>}
            {(essentials || band) && <ColorField copy={copy} label={copy.bandColor} value={settings.bandColor} onChange={value => update("bandColor", value)}/>}
            {thisIs && <ColorField copy={copy} label={copy.accentColor} value={settings.bandColor} onChange={value => update("bandColor", value)}/>}
          </Section>

          {/* 5. Photo or background. */}
          {(essentials || thisIs || band) && <Section title={copy.yourPhoto}>
            <PhotoControls showPhotoFrame={essentials || band} topMarginLabel={band ? copy.bandEdgeMargin : copy.includeTopMargin} copy={copy} photo={photo} photoName={photoName} uploading={uploading} dragging={dragging} setDragging={setDragging} fileInput={fileInput} upload={upload} onRemove={() => { uploadId.current++; setUploading(false); setPhoto(null); setPhotoName(""); }} settings={settings} update={update} updatePhotoFrame={updatePhotoFrame} photoFrameChanged={photoFrameChanged} resetPhotoFrame={resetPhotoFrame}/>
          </Section>}

          {(classic || fullPhoto) && <Section title={copy.background}>
            <DraggableSegments className="segmented">{([['gradients', copy.gradient],['custom', copy.color],['picture', copy.picture]] as const).map(([value,label]) => <button key={value} className={backgroundType === value ? "active" : ""} aria-pressed={backgroundType === value} onClick={() => update(backgroundKey, value)}>{label}</button>)}</DraggableSegments>
            {backgroundType === "picture" ? <PhotoControls copy={copy} photo={photo} photoName={photoName} uploading={uploading} dragging={dragging} setDragging={setDragging} fileInput={fileInput} upload={upload} onRemove={() => { uploadId.current++; setUploading(false); setPhoto(null); setPhotoName(""); }} settings={settings} update={update} showPhotoFrame={false}/> : backgroundType === "custom" ? <ColorField copy={copy} label={copy.backgroundColor} value={settings.customColor} onChange={value => update("customColor", value)}/> : <div className="swatches">{Array.from({ length: 40 }, (_, i) => { const name = copy.gradientN(i + 1); const selected = settings.gradient === i; return <button key={`${backgroundType}-${i}`} title={name} aria-label={name} aria-pressed={selected} className={`swatch ${selected ? "selected" : ""}`} onClick={() => update("gradient", i)}><img src={`/assets/gradients/${i}.png`} alt=""/>{selected && <Check size={15}/>}</button>; })}</div>}
          </Section>}

          {/* 6. Logo. */}
          <Section title={spotify ? copy.spotifyLogo : copy.appleLogo} last>
            <label className="toggle-row"><span>{copy.showLogo}</span><DragToggle checked={settings.showLogo} onChange={value => update("showLogo", value)}/></label>
            {settings.showLogo && <div className="corner-options">{corners.map(corner => { const disabled = bottomLogoUnavailable && corner.startsWith("bottom"); return <button disabled={disabled} key={corner} className={settings.corner === corner ? "active" : ""} aria-pressed={settings.corner === corner} title={disabled ? copy.bottomCornerHint : undefined} onClick={() => setSettings(s => ({ ...s, corner, bandHeight: essentials && corner.startsWith("top") ? Math.max(s.bandHeight, 27) : s.bandHeight }))}><span className={`corner-icon ${corner}`}><i/></span>{copy.corners[corner]}</button>; })}</div>}
            {settings.showLogo && bottomLogoUnavailable && <p className="help-text">{copy.bottomCornerHelp}</p>}
            {!spotify && settings.showLogo && <div className="style-options logo-style-options" role="group" aria-label={copy.logoStyle}>
              {(["classic", "new"] as const).map(value => { const logo = appleLogoShape(value); const name = value === "classic" ? copy.logoClassic : copy.logoNew; return <button key={value} className={`style-option ${settings.appleLogo === value ? "selected" : ""}`} aria-pressed={settings.appleLogo === value} aria-label={`${copy.logoStyle}: ${name}`} title={name} onClick={() => update("appleLogo", value)}><span className="platform-logo" aria-hidden="true"><svg viewBox={`0 0 ${logo.width} ${logo.height}`}><path d={logo.path}/></svg></span></button>; })}
            </div>}
          </Section>
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

/** A settings group: heading plus a body whose rows share one consistent gap. */
function Section({ title, last = false, children }: { title: string; last?: boolean; children: ReactNode }) {
  return <div className={`control-section${last ? " last-section" : ""}`}><div className="section-heading"><h2>{title}</h2></div><div className="section-body">{children}</div></div>;
}

function TextField({ label, value, onChange, placeholder, maxLength = 100 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; maxLength?: number }) {
  return <label className="field">{label}<input maxLength={maxLength} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/></label>;
}

function RangeField({ label, value, unit, min, max, step = "1", onChange }: { label: string; value: number; unit: string; min: number | string; max: number | string; step?: string; onChange: (value: number) => void }) {
  return <label className="range-label">{label}<span>{value}{unit}</span><SmoothRange min={min} max={max} step={step} value={value} onValueChange={onChange}/></label>;
}

function SegmentField<T extends string | boolean>({ label, value, options, onChange, className = "", optionClass }: { label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (value: T) => void; className?: string; optionClass?: (value: T) => string }) {
  return <div className="inline-row"><div className="field-label">{label}</div><DraggableSegments className={`segmented ${className}`}>{options.map(([option, text]) => <button key={String(option)} className={`${value === option ? "active" : ""} ${optionClass?.(option) ?? ""}`} aria-pressed={value === option} onClick={() => onChange(option)}>{text}</button>)}</DraggableSegments></div>;
}

type ColorPreset = { label: string; hex: string };

/** Color row: a rainbow "custom" swatch that opens the system picker, then preset swatches. */
function ColorField({ copy, label, value, onChange, presets }: { copy: Dictionary["editor"]; label: string; value: string; onChange: (value: string) => void; presets?: readonly ColorPreset[] }) {
  const options = presets ?? BASIC_COLORS.map(([name, hex]) => ({ label: copy.colorNames[name], hex }));
  const selected = findPreset(value, options.map(option => option.hex));
  return <div className="color-control">
    <span>{label}</span>
    <div className="color-swatches" role="group" aria-label={label}>
      <label className={`color-swatch custom-swatch${selected ? "" : " selected"}`} title={copy.customColor}><input type="color" aria-label={`${label}: ${copy.customColor}`} value={value} onChange={e => onChange(e.target.value)}/></label>
      {options.map(option => <button key={option.hex} type="button" className={`color-swatch${selected === option.hex ? " selected" : ""}`} style={{ background: option.hex }} title={option.label} aria-label={`${label}: ${option.label}`} aria-pressed={selected === option.hex} onClick={() => onChange(option.hex)}/>)}
    </div>
  </div>;
}

function styleCopy(copy: Dictionary["editor"], mode: CoverMode): [string, string] {
  switch (mode) {
    case "classic": return [copy.original, copy.originalHint];
    case "essentials": return [copy.essentials, copy.essentialsHint];
    case "spotify-this-is": return [copy.thisIs, copy.thisIsHint];
    case "spotify-band": return [copy.spotifyBand, copy.spotifyBandHint];
    case "spotify-photo": return [copy.spotifyPhoto, copy.spotifyPhotoHint];
  }
}

function StyleThumb({ mode }: { mode: CoverMode }) {
  if (mode === "classic") return <span className="style-thumb classic-thumb" aria-hidden="true">Aa</span>;
  if (mode === "essentials") return <span className="style-thumb essentials-thumb" aria-hidden="true"><span>Essentials</span><Music2 size={19}/></span>;
  if (mode === "spotify-this-is") return <span className="style-thumb this-is-thumb" aria-hidden="true"><b>THIS IS</b><i/><b>Artist</b></span>;
  if (mode === "spotify-band") return <span className="style-thumb band-thumb" aria-hidden="true"><i/><b>Title</b></span>;
  return <span className="style-thumb photo-thumb" aria-hidden="true"><b>Title</b></span>;
}

type DownloadHandoff = { url: string; filename: string; size: number; x: number; y: number; scale: number; leaving: boolean };

function PhotoControls({
  copy, photo, photoName, uploading, dragging, setDragging, fileInput, upload, onRemove, settings, update, updatePhotoFrame, photoFrameChanged, resetPhotoFrame, showPhotoFrame = true, topMarginLabel = copy.includeTopMargin,
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
  topMarginLabel?: string;
}) {
  return <>
    <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden-input" aria-label={copy.uploadPhoto} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }}/>
    <button className={`upload-zone ${dragging ? "dragging" : ""}`} onClick={() => fileInput.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files[0]); }}><ImagePlus size={23}/><strong>{uploading ? copy.openingPhoto : photo ? copy.replacePhoto : copy.addPhoto}</strong><span>{copy.dropPhoto}</span><small>{copy.photoTypes}</small></button>
    {photo && <div className="file-row"><span>{photoName}</span><button className="icon-button" aria-label={copy.removePhoto} onClick={onRemove}><X size={14}/></button></div>}
    {photo ? <>
    {showPhotoFrame && updatePhotoFrame && resetPhotoFrame && <div className="photo-frame-controls"><div className="field-label">{copy.photoFrame}<button className="icon-button" title={copy.resetPhotoFrame} aria-label={copy.resetPhotoFrame} disabled={!photoFrameChanged} onClick={resetPhotoFrame}><RotateCcw size={14}/></button></div><label className="range-label">{copy.sideMargin}<span>{settings.photoMargin}%</span><SmoothRange min="0" max="12" step="1" value={settings.photoMargin} onValueChange={value => updatePhotoFrame("photoMargin", value)}/></label><label className="toggle-row compact frame-toggle"><span>{topMarginLabel}</span><DragToggle checked={settings.photoTopMargin} onChange={value => update("photoTopMargin", value)}/></label><label className="range-label">{copy.roundedCorners}<span>{settings.photoRadius}%</span><SmoothRange min="0" max="10" step="1" value={settings.photoRadius} onValueChange={value => updatePhotoFrame("photoRadius", value)}/></label></div>}
    <div className="inline-row"><div className="field-label photo-treatment-label">{copy.photoTreatment}<button className="icon-button" title={copy.resetPhotoTreatment} aria-label={copy.resetPhotoTreatment} disabled={!treatmentChanged(settings.mode, settings)} onClick={() => { const start = treatmentDefaults(settings.mode); update("treatment", start.treatment); update("tint", start.tint); update("brightness", start.brightness); update("contrast", start.contrast); }}><RotateCcw size={14}/></button></div><DraggableSegments className="segmented treatments">{([['original', copy.originalTreatment],['mono', copy.mono],['duotone', copy.duotone]] as const).map(([value,label]) => <button key={value} aria-pressed={settings.treatment === value} className={settings.treatment === value ? "active" : ""} onClick={() => update("treatment", value)}>{label}</button>)}</DraggableSegments></div>
    {settings.treatment === "duotone" && <ColorField copy={copy} label={copy.duotoneTint} value={settings.tint} presets={tintColors.map(hex => ({ label: copy.duotoneColor(hex), hex }))} onChange={value => update("tint", value)}/>}
    <div className="photo-tone-controls"><label className="range-label">{copy.brightness}<span>{settings.brightness > 0 ? `+${settings.brightness}` : settings.brightness}</span><SmoothRange min="-100" max="100" step="1" value={settings.brightness} onValueChange={value => update("brightness", value)}/></label><label className="range-label">{copy.contrast}<span>{settings.contrast > 0 ? `+${settings.contrast}` : settings.contrast}</span><SmoothRange min="-100" max="100" step="1" value={settings.contrast} onValueChange={value => update("contrast", value)}/></label></div>
    <div className="crop-controls"><label className="range-label">{copy.zoom}<span>{settings.zoom.toFixed(1)}×</span><SmoothRange min="1" max="3" step="0.05" value={settings.zoom} onValueChange={value => update("zoom", value)}/></label><label className="range-label">{copy.horizontal}<span>{settings.offsetX}%</span><SmoothRange min="0" max="100" value={settings.offsetX} onValueChange={value => update("offsetX", value)}/></label><label className="range-label">{copy.vertical}<span>{settings.offsetY}%</span><SmoothRange min="0" max="100" value={settings.offsetY} onValueChange={value => update("offsetY", value)}/></label></div>
    </> : <p className="help-text">{copy.photoHelp}</p>}
  </>;
}
