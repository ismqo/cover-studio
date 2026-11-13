"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode, type RefObject } from "react";
import { ALargeSmall, Archive, Hash, SeparatorHorizontal, Shapes, Trash2, AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowUpToLine, Baseline, Blend, Bold, Brush, Contrast, Droplet, Droplets, Eclipse, Eye, FoldHorizontal, Frame, Grid2x2, Heading, Image as ImageIcon, ImagePlus, Layers, Layers2, Link, MoveHorizontal, MoveVertical, PaintBucket, Palette, PanelTop, PanelTopDashed, Pilcrow, RotateCcw, Ruler, SlidersHorizontal, Spline, Squircle, Sun, SunMoon, Tag, Text, Type, UserRound, Users, X, ZoomIn, type LucideIcon } from "lucide-react";
import { NavMenu } from "@/components/nav-menu";
import { BrandMark } from "@/components/brand-mark";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DragToggle, DraggableSegments } from "@/components/drag-switch";
import { SmoothRange } from "@/components/smooth-range";
import { useI18n } from "@/components/locale-provider";
import { CoverSettings, defaults, loadImage, releaseImage, renderCover } from "@/lib/render-cover";
import { clearMemories, loadMemories, saveMemory, type CoverMemory } from "@/lib/cover-memories";
import { localizeCoverSamples, type Dictionary, type NoticeKey } from "@/lib/i18n";
import { APPLE_MUSIC_PICKER_PATH, APPLE_MUSIC_PICKER_VIEWBOX, appleLogoShape } from "@/lib/apple-logo";
import { SPOTIFY_PATH } from "@/lib/spotify-logo";
import { BASIC_COLORS, findPreset } from "@/lib/color-presets";
import { activeBackground, artistLookAt, spotifyFontFor, spotifyFonts, DAILY_MIX_MAX, DAILY_MIX_TINT_OPACITY, DAILY_MIX_WAVE, dailyMixDesignDefaults, parseMixNumber, DEFAULT_ARTIST_LOOK, GRADIENT_TYPES, treatmentDefaults, treatmentDiffers, type ArtistLook } from "@/lib/cover-layout";
import { allowedLogoCorner, type ArtistCount, classicTitleYMax, titleLines, logoCornerFor, platformModes, titleCorner, platformOf, styleDefaults, type CoverMode, type Platform } from "@/lib/cover-layout";
import { previewTilt } from "@/lib/preview-tilt";

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
  // Similar Artist Radio: photos of the second and third artists (the main artist uses `photo`).
  const [artistPhotos, setArtistPhotos] = useState<(string | null)[]>([null, null]);
  const [artistNames, setArtistNames] = useState<string[]>(["", ""]);
  const [artistUploading, setArtistUploading] = useState<boolean[]>([false, false]);
  const artistUploadIds = useRef([0, 0]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // Reset animation: the cover is thrown aside, the reset happens off-screen, and the new cover lands once drawn.
  const [resetPhase, setResetPhase] = useState<"throw" | "land" | null>(null);
  const resetPending = useRef(false);
  // Saved versions (IndexedDB): the newest three, with object URLs for their previews.
  const [memories, setMemories] = useState<CoverMemory[]>([]);
  const [memoryThumbs, setMemoryThumbs] = useState<Record<string, string>>({});
  const [activeMemory, setActiveMemory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const restoringMemory = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [rendering, setRendering] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [handoff, setHandoff] = useState<DownloadHandoff | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const coverGrab = useRef<{ pointerId: number; x: number; y: number; width: number; height: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadId = useRef(0);
  function grabCover(event: PointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary || event.button !== 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    coverGrab.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, width: rect.width, height: rect.height };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.grabbing = "true";
  }
  function tiltCover(event: PointerEvent<HTMLCanvasElement>) {
    const grab = coverGrab.current;
    if (!grab || grab.pointerId !== event.pointerId) return;
    const tilt = previewTilt(event.clientX - grab.x, event.clientY - grab.y, grab.width, grab.height);
    event.currentTarget.style.setProperty("--tilt-x", `${tilt.x}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${tilt.y}deg`);
  }
  function releaseCover(event: PointerEvent<HTMLCanvasElement>) {
    if (coverGrab.current?.pointerId !== event.pointerId) return;
    coverGrab.current = null;
    delete event.currentTarget.dataset.grabbing;
    event.currentTarget.style.removeProperty("--tilt-x");
    event.currentTarget.style.removeProperty("--tilt-y");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  const essentials = settings.mode === "essentials";
  const artists = settings.mode === "similar-artists";
  const classic = settings.mode === "classic";
  const platform = platformOf(settings.mode);
  const spotify = platform === "spotify";
  const band = settings.mode === "spotify-band";
  const thisIs = settings.mode === "spotify-this-is";
  const dailyMix = settings.mode === "spotify-daily-mix";
  const newDailyMix = dailyMix && settings.dailyMixDesign === "new";
  const hasSubtitle = band || settings.mode === "spotify-photo";
  const showSpotifySubtitle = hasSubtitle && settings.spotifyShowSubtitle;
  const fullPhoto = settings.mode === "spotify-photo";
  // Original and Full photo each keep their own background choice.
  const backgroundKey = fullPhoto ? "spotifyBackgroundType" : "backgroundType";
  // Similar Artist Radio has no picture background: a picture choice carried over from Original shows as color.
  const backgroundType = artists ? activeBackground(settings.mode, settings.backgroundType, settings.spotifyBackgroundType)! : settings[backgroundKey];
  const displayTitle = dailyMix ? settings.dailyMixTitle : spotify ? settings.spotifyTitle : essentials ? settings.essentialsTitle : artists ? copy.similarArtists : settings.title;
  const selectMode = (mode: CoverMode) => { setSettings(s => ({ ...s, mode, ...styleDefaults(mode) })); setStatus(""); };
  const selectPlatform = (next: Platform) => { if (next !== platform) selectMode(platformModes[next][0]); };
  const takenCorner = titleCorner(settings.mode, settings.spotifyTitlePosition, settings.spotifyAlign);
  const titleYMax = classicTitleYMax(settings.classicFontSize, settings.classicSubtitleFontSize, settings.classicSubtitleGap, titleLines(settings.title).length);
  // Original's title owns its corner: when the title moves onto the logo, the logo moves to the other side of the edge.
  useEffect(() => {
    if (settings.corner === takenCorner) setSettings(s => ({ ...s, corner: allowedLogoCorner(s.corner, takenCorner) }));
  }, [takenCorner, settings.corner]);
  const update = <K extends keyof CoverSettings>(key: K, value: CoverSettings[K]) => {
    setSettings(s => ({ ...s, [key]: value })); setStatus("");
  };
  const updatePhotoFrame = (key: "photoMargin" | "photoRadius", value: number) => {
    setSettings(s => ({
      ...s,
      [key]: value,
    }));
    setStatus("");
  };
  const photoFrameChanged = settings.photoMargin !== defaults.photoMargin || settings.photoTopMargin !== defaults.photoTopMargin || settings.photoRadius !== defaults.photoRadius;
  const resetPhotoFrame = () => {
    setSettings(s => ({ ...s, photoMargin: defaults.photoMargin, photoTopMargin: defaults.photoTopMargin, photoRadius: defaults.photoRadius }));
    setStatus("");
  };
  const updateClassicTextBlock = (key: "classicFontSize" | "classicSubtitleFontSize" | "classicSubtitleGap", value: number) => {
    setSettings(s => {
      const next = { ...s, [key]: value };
      return { ...next, classicTitleY: Math.min(s.classicTitleY, classicTitleYMax(next.classicFontSize, next.classicSubtitleFontSize, next.classicSubtitleGap, titleLines(next.title).length)) };
    });
    setStatus("");
  };
  // Extra title lines push the subtitle down, so the title may have to move up to stay above the footer.
  const updateClassicTitle = (title: string) => {
    setSettings(s => ({ ...s, title, classicTitleY: Math.min(s.classicTitleY, classicTitleYMax(s.classicFontSize, s.classicSubtitleFontSize, s.classicSubtitleGap, titleLines(title).length)) }));
    setStatus("");
  };

  useEffect(() => {
    let cancelled = false;
    setRendering(true);
    const buffer = document.createElement("canvas");
    renderCover(buffer, settings, photo, artistPhotos).then(() => {
      if (!cancelled && canvas.current) {
        canvas.current.width = canvas.current.height = 1200;
        canvas.current.getContext("2d")!.drawImage(buffer, 0, 0);
        setRendering(false);
        if (resetPending.current) { resetPending.current = false; setResetPhase("land"); }
      }
    }).catch((e: Error) => {
      if (cancelled) return;
      setError(e.message); setRendering(false);
      if (resetPending.current) { resetPending.current = false; setResetPhase("land"); }
    });
    return () => { cancelled = true; };
  }, [settings, photo, artistPhotos]);

  useEffect(() => () => { if (photo) releaseImage(photo); }, [photo]);
  const [artistPhoto2, artistPhoto3] = artistPhotos;
  useEffect(() => () => { if (artistPhoto2) releaseImage(artistPhoto2); }, [artistPhoto2]);
  useEffect(() => () => { if (artistPhoto3) releaseImage(artistPhoto3); }, [artistPhoto3]);

  useEffect(() => { loadMemories().then(setMemories).catch(() => {}); }, []);
  useEffect(() => {
    const urls = Object.fromEntries(memories.map(memory => [memory.id, URL.createObjectURL(memory.thumbnail)]));
    setMemoryThumbs(urls);
    return () => Object.values(urls).forEach(url => URL.revokeObjectURL(url));
  }, [memories]);
  // A restored or just-saved version stays highlighted until the cover is edited.
  useEffect(() => {
    if (restoringMemory.current) { restoringMemory.current = false; return; }
    setActiveMemory(null);
  }, [settings, photo, artistPhotos]);

  async function saveVersion() {
    if (saving || !canvas.current) return;
    setSaving(true); setError(""); setStatus("");
    try {
      const preview = document.createElement("canvas");
      preview.width = preview.height = 160;
      preview.getContext("2d")!.drawImage(canvas.current, 0, 0, 160, 160);
      const thumbnail = await new Promise<Blob>((resolve, reject) => preview.toBlob(b => b ? resolve(b) : reject(new Error("saveFailed")), "image/jpeg", .85));
      const photoBlob = photo ? await (await fetch(photo)).blob() : null;
      const artistBlobs = await Promise.all(artistPhotos.map(async (src, i) => ({ photo: src ? await (await fetch(src)).blob() : null, name: artistNames[i] })));
      const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      setMemories(await saveMemory({ id, savedAt: Date.now(), settings, photo: photoBlob, photoName, artistPhotos: artistBlobs, thumbnail }));
      setActiveMemory(id);
      setStatus("saved");
    } catch { setError("saveFailed"); }
    finally { setSaving(false); }
  }

  async function deleteAllMemories() {
    setError(""); setStatus("");
    try {
      await clearMemories();
      setMemories([]);
      setActiveMemory(null);
      setStatus("deleted");
    } catch { setError("deleteFailed"); }
  }

  function restoreMemory(memory: CoverMemory) {
    uploadId.current++; setUploading(false);
    cancelArtistUploads();
    // Versions saved before Similar Artist Radio have no artist photos.
    const saved = [0, 1].map(i => memory.artistPhotos?.[i]);
    setArtistPhotos(saved.map(artist => artist?.photo ? URL.createObjectURL(artist.photo) : null));
    setArtistNames(saved.map(artist => artist?.name ?? ""));
    restoringMemory.current = true;
    // Versions saved with a gradient type that no longer exists (e.g. conic) fall back to linear.
    const restored = { ...defaults, ...memory.settings };
    if (!(GRADIENT_TYPES as readonly string[]).includes(restored.gradientType)) restored.gradientType = defaults.gradientType;
    setSettings(restored);
    setPhoto(memory.photo ? URL.createObjectURL(memory.photo) : null);
    setPhotoName(memory.photoName);
    setActiveMemory(memory.id);
    setError(""); setStatus("restored");
  }

  const savedAtLabel = (savedAt: number) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(savedAt);

  /** Checks and decodes a photo file; returns its object URL, or null after reporting why it was rejected. `current` tells whether this upload is still the latest for its slot. */
  async function openPhoto(file: File, current: () => boolean): Promise<string | null> {
    setError(""); setStatus("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("fileType"); return null; }
    if (file.size > 20 * 1024 * 1024) { setError("fileSize"); return null; }
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      if (image.width * image.height > 60_000_000) throw new Error("photoTooLarge");
      if (!current()) { releaseImage(url); return null; }
      return url;
    } catch (e) { releaseImage(url); if (current()) setError((e as Error).message); return null; }
  }

  async function upload(file?: File) {
    if (!file) return;
    const id = ++uploadId.current;
    const current = () => id === uploadId.current;
    setUploading(true);
    const url = await openPhoto(file, current);
    if (url) {
      setPhoto(url); setPhotoName(file.name);
      setSettings(s => ({ ...s, zoom: 1, offsetX: 50, offsetY: 50 }));
    }
    if (current()) setUploading(false);
  }

  const setArtistSlot = <T,>(setter: (update: (items: T[]) => T[]) => void, index: number, value: T) => setter(items => items.map((item, i) => i === index ? value : item));

  /** Uploads the second (index 0) or third (index 1) artist's photo and resets its crop. */
  async function uploadArtist(index: number, file?: File) {
    if (!file) return;
    const id = ++artistUploadIds.current[index];
    const current = () => id === artistUploadIds.current[index];
    setArtistSlot(setArtistUploading, index, true);
    const url = await openPhoto(file, current);
    if (url) {
      setArtistSlot(setArtistPhotos, index, url);
      setArtistSlot(setArtistNames, index, file.name);
      // A new photo starts uncropped but keeps the artist's treatment, like the main photo.
      updateArtistLook(index, { zoom: 1, offsetX: 50, offsetY: 50 });
    }
    if (current()) setArtistSlot(setArtistUploading, index, false);
  }

  function removeArtist(index: number) {
    artistUploadIds.current[index]++;
    setArtistSlot(setArtistUploading, index, false);
    setArtistSlot<string | null>(setArtistPhotos, index, null);
    setArtistSlot(setArtistNames, index, "");
  }

  function cancelArtistUploads() {
    artistUploadIds.current = artistUploadIds.current.map(id => id + 1);
    setArtistUploading([false, false]);
  }

  const updateArtistLook = (index: number, patch: Partial<ArtistLook>) => {
    setSettings(s => ({ ...s, artistLooks: [0, 1].map(i => i === index ? { ...artistLookAt(s.artistLooks, i), ...patch } : artistLookAt(s.artistLooks, i)) }));
    setStatus("");
  };

  async function download() {
    setExporting(true); setError("");
    try {
      const output = document.createElement("canvas");
      await renderCover(output, settings, photo, artistPhotos);
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

  function throwAndReset() {
    if (resetPhase) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { reset(); return; }
    setResetPhase("throw");
  }

  function onCoverAnimationEnd() {
    if (resetPhase === "throw") { resetPending.current = true; reset(); }
    else if (resetPhase === "land") setResetPhase(null);
  }

  function reset() {
    uploadId.current++; setUploading(false); setSettings(localizeCoverSamples(defaults, locale)); setPhoto(null); setPhotoName(""); setError(""); setStatus("reset");
    cancelArtistUploads(); setArtistPhotos([null, null]); setArtistNames(["", ""]);
  }

  return <>
  <div className="app-shell">
    <header className="app-header">
      <nav className="editor-nav liquid-nav" aria-label={t.nav.main}>
      <a href="/" className="brand" aria-label={t.nav.home}><BrandMark className="brand-mark"/>Cover<span className="studio-label">STUDIO</span></a>
      <div className="editor-nav-actions">
        <NavMenu />
      </div>
      </nav>
    </header>

    <main>
      <div className="workspace">
        <div className="preview-column">
        <section className="preview-panel" aria-label={copy.coverPreview}>
          <div className="section-top"><span><span className="live-dot"/> {copy.livePreview}</span><div className="preview-actions"><button className="icon-button" onClick={() => setConfirmingReset(true)} aria-haspopup="dialog" title={copy.resetCover} aria-label={copy.resetCover}><RotateCcw size={15}/></button></div></div>
          <div className="preview-stage">
            {memories.length > 0 && <div className="memory-rail"><div className="memory-list" role="group" aria-label={copy.savedVersions}>{memories.map(memory =>
              <button key={memory.id} type="button" className="memory" aria-pressed={activeMemory === memory.id} onClick={() => restoreMemory(memory)}
                aria-label={copy.restoreVersion(savedAtLabel(memory.savedAt))} title={copy.restoreVersion(savedAtLabel(memory.savedAt))}>
                {memoryThumbs[memory.id] && <img src={memoryThumbs[memory.id]} alt=""/>}
              </button>)}</div>
              <button type="button" className="download memory-delete" onClick={() => setConfirmingDelete(true)} aria-haspopup="dialog"
                aria-label={copy.deleteAllVersions} title={copy.deleteAllVersions}><Trash2 size={16}/></button>
            </div>}
            <canvas ref={canvas} width="1200" height="1200" aria-label={copy.coverPreviewNamed(displayTitle)} role="img" onPointerDown={grabCover} onPointerMove={tiltCover} onPointerUp={releaseCover} onPointerCancel={releaseCover} onLostPointerCapture={releaseCover}
            data-reset={resetPhase ?? undefined} onAnimationEnd={onCoverAnimationEnd}/></div>
          <button className="download mobile-preview-download" onClick={download} disabled={exporting || rendering || uploading || artistUploading.some(Boolean) || !!handoff} aria-label={exporting ? copy.exporting : copy.download} title={exporting ? copy.exporting : copy.download}><ArrowDownToLine size={16}/><span>{exporting ? copy.exporting : copy.download}</span></button>
          <button className="download mobile-preview-archive" onClick={saveVersion} disabled={saving || rendering || uploading || artistUploading.some(Boolean) || !!handoff} aria-label={copy.saveVersion} title={copy.saveVersion}><Archive size={16}/></button>
          <div className="preview-download"><button className="download" onClick={download} disabled={exporting || rendering || uploading || artistUploading.some(Boolean) || !!handoff}><ArrowDownToLine size={16}/>{exporting ? copy.exporting : copy.download}</button><button className="download archive-button" onClick={saveVersion} disabled={saving || rendering || uploading || artistUploading.some(Boolean) || !!handoff} aria-label={copy.saveVersion} title={copy.saveVersion}><Archive size={16}/></button></div>
        </section>
        <p className="preview-credit">{copy.caption}</p>
        </div>

        <section className="controls" aria-label={copy.coverSettings} tabIndex={0}>
          <Section title={copy.platform} className="first-section">
            <div className="style-options">
              {(["apple", "spotify"] as const).map(value => <button key={value} className={`style-option ${platform === value ? "selected" : ""}`} aria-pressed={platform === value} aria-label={value === "apple" ? copy.appleMusic : copy.spotify} title={value === "apple" ? copy.appleMusic : copy.spotify} onClick={() => selectPlatform(value)}><span className={`platform-logo ${value}-logo`} aria-hidden="true">{value === "apple" ? <svg viewBox={`0 0 ${APPLE_MUSIC_PICKER_VIEWBOX.width} ${APPLE_MUSIC_PICKER_VIEWBOX.height}`}><path d={APPLE_MUSIC_PICKER_PATH}/></svg> : <i/>}</span></button>)}
            </div>
          </Section>

          <Section title={copy.coverStyle} className="first-section">
            <div key={platform} className="style-options style-carousel" role="group" aria-label={copy.coverStyle}>
              {platformModes[platform].map(mode => <button key={mode} className={`style-option ${settings.mode === mode ? "selected" : ""}`} aria-pressed={settings.mode === mode} onClick={e => { selectMode(mode); e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" }); }}><StyleThumb mode={mode} copy={copy}/><span><strong>{styleCopy(copy, mode)[0]}</strong><small>{styleCopy(copy, mode)[1]}</small></span></button>)}
            </div>
          </Section>

          {/* 1. Text: what the cover says. Similar Artist Radio has none. */}
          {!artists && <Section title={copy.textContent}>
            {thisIs && <TextField icon={Tag} label={copy.kicker} maxLength={40} value={settings.spotifyKicker} onChange={value => update("spotifyKicker", value)}/>}
            {hasSubtitle && <SegmentField icon={Layers} label={copy.content} value={settings.spotifyShowSubtitle} options={[[false, copy.titleOnly], [true, copy.titleAndSubtitle]]} onChange={value => update("spotifyShowSubtitle", value)}/>}
            {dailyMix && <TextField multiline icon={Heading} label={copy.title} maxLength={40} value={settings.dailyMixTitle} placeholder={copy.dailyMix} onChange={value => update("dailyMixTitle", value)}/>}
            {spotify && !dailyMix && <TextField multiline icon={Heading} label={copy.title} value={settings.spotifyTitle} placeholder={copy.sampleTitle} onChange={value => update("spotifyTitle", value)}/>}
            {showSpotifySubtitle && <TextField icon={Text} label={copy.subtitle} value={settings.spotifySubtitle} placeholder={copy.sampleSubtitle} onChange={value => update("spotifySubtitle", value)}/>}
            {essentials && <TextField multiline icon={Heading} label={copy.title} value={settings.essentialsTitle} placeholder={copy.sampleEssentials} onChange={value => update("essentialsTitle", value)}/>}
            {classic && <>
              <TextField multiline icon={Heading} label={copy.bigTitle} value={settings.title} placeholder={copy.sampleTitle} onChange={updateClassicTitle}/>
              <TextField icon={Text} label={copy.subtitle} value={settings.subtitle} placeholder={copy.sampleSubtitle} onChange={value => update("subtitle", value)}/>
              <TextField icon={Pilcrow} label={copy.footer} maxLength={150} value={settings.footer} placeholder={copy.sampleFooter} onChange={value => update("footer", value)}/>
            </>}
          </Section>}

          {/* 2. Typography: how the text looks, in reading order. */}
          {!artists && <Section title={copy.typography}>
            {spotify && !thisIs && <SegmentField icon={Type} label={copy.titleFont} value={spotifyFontFor(settings.mode, settings.spotifyFont)} options={spotifyFonts(settings.mode).map(font => [font, { standard: copy.fontStandard, wide: copy.fontWide, condensed: copy.fontCondensed }[font]] as const)} optionClass={value => `font-${value}`} className="font-options" onChange={value => update("spotifyFont", value)}/>}
            {thisIs && <RangeField icon={ALargeSmall} label={copy.kickerSize} unit="px" min="72" max="168" step="2" value={settings.spotifyKickerFontSize} defaultValue={defaults.spotifyKickerFontSize} onChange={value => update("spotifyKickerFontSize", value)}/>}
            {dailyMix && <RangeField icon={ALargeSmall} label={copy.titleSize} unit="px" min="72" max="200" step="2" value={settings.dailyMixFontSize} defaultValue={dailyMixDesignDefaults(settings.dailyMixDesign).dailyMixFontSize} onChange={value => update("dailyMixFontSize", value)}/>}
            {spotify && !dailyMix && <RangeField icon={ALargeSmall} label={copy.titleSize} unit="px" min="72" max="240" step="2" value={settings.spotifyFontSize} defaultValue={defaults.spotifyFontSize} onChange={value => update("spotifyFontSize", value)}/>}
            {showSpotifySubtitle && <RangeField icon={ALargeSmall} label={copy.subtitleSize} unit="px" min="32" max="200" step="2" value={settings.spotifySubtitleFontSize} defaultValue={defaults.spotifySubtitleFontSize} onChange={value => update("spotifySubtitleFontSize", value)}/>}
            {showSpotifySubtitle && <RangeField icon={SeparatorHorizontal} label={copy.subtitleGap} unit="px" min="0" max="120" step="2" value={settings.spotifySubtitleGap} defaultValue={defaults.spotifySubtitleGap} onChange={value => update("spotifySubtitleGap", value)}/>}
            {essentials && <RangeField icon={ALargeSmall} label={copy.titleSize} unit="px" min="72" max="180" step="2" value={settings.essentialsFontSize} defaultValue={defaults.essentialsFontSize} onChange={fontSize => setSettings(s => ({ ...s, essentialsFontSize: fontSize, bandHeight: Math.max(s.bandHeight, 27) }))}/>}
            {classic && <>
              <RangeField icon={ALargeSmall} label={copy.bigTitleSize} unit="px" min="96" max="216" step="1" value={settings.classicFontSize} defaultValue={defaults.classicFontSize} onChange={value => updateClassicTextBlock("classicFontSize", value)}/>
              <SegmentField icon={Bold} label={copy.bigTitleWeight} value={settings.classicTitleWeight} options={[["normal", copy.normal, Baseline], ["bold", copy.bold, Bold]]} onChange={value => update("classicTitleWeight", value)}/>
              <RangeField icon={ALargeSmall} label={copy.subtitleSize} unit="px" min="72" max="180" step="1" value={settings.classicSubtitleFontSize} defaultValue={defaults.classicSubtitleFontSize} onChange={value => updateClassicTextBlock("classicSubtitleFontSize", value)}/>
              <RangeField icon={SeparatorHorizontal} label={copy.subtitleGap} unit="px" min="0" max="160" step="2" value={settings.classicSubtitleGap} defaultValue={defaults.classicSubtitleGap} onChange={value => updateClassicTextBlock("classicSubtitleGap", value)}/>
              <SegmentField icon={Bold} label={copy.subtitleWeight} value={settings.classicSubtitleWeight} options={[["normal", copy.normal, Baseline], ["bold", copy.bold, Bold]]} onChange={value => update("classicSubtitleWeight", value)}/>
            </>}
          </Section>}

          {/* 2b. Daily Mix number: whether it shows, its value, and (new design) its label size. */}
          {dailyMix && <Section title={copy.mixNumber}>
            <label className="toggle-row"><RowLabel icon={Eye}>{copy.showMixNumber}</RowLabel><DragToggle checked={settings.dailyMixShowNumber} onChange={value => update("dailyMixShowNumber", value)}/></label>
            {settings.dailyMixShowNumber && <MixNumberField icon={Hash} label={copy.number} value={settings.dailyMixNumber} onChange={value => update("dailyMixNumber", value)}/>}
            {newDailyMix && settings.dailyMixShowNumber && <RangeField icon={ALargeSmall} label={copy.numberSize} unit="px" min="120" max="260" step="2" value={settings.dailyMixNumberSize} defaultValue={defaults.dailyMixNumberSize} onChange={value => update("dailyMixNumberSize", value)}/>}
          </Section>}

          {/* 3. Layout: where things sit. */}
          {!thisIs && !artists && <Section title={copy.layout}>
            {dailyMix && <SegmentField icon={Shapes} label={copy.design} value={settings.dailyMixDesign} options={[["classic", copy.designClassic], ["new", copy.designNew]]} onChange={design => { setSettings(s => ({ ...s, ...dailyMixDesignDefaults(design) })); setStatus(""); }}/>}
            {spotify && !dailyMix && <>
              <SegmentField icon={PanelTop} label={band ? copy.bandPosition : copy.titlePlacement} value={settings.spotifyTitlePosition} options={[["top", copy.top, ArrowUpToLine], ["bottom", copy.bottom, ArrowDownToLine]]} onChange={value => update("spotifyTitlePosition", value)}/>
              {!band && <SegmentField icon={AlignLeft} label={copy.titleAlignment} value={settings.spotifyAlign} options={[["left", copy.left, AlignLeft], ["right", copy.right, AlignRight]]} onChange={value => update("spotifyAlign", value)}/>}
            </>}
            {classic && <>
              <SegmentField icon={AlignLeft} label={copy.titleAlignment} value={settings.classicAlign} options={[["left", copy.left, AlignLeft], ["center", copy.center, AlignCenter]]} onChange={value => update("classicAlign", value)}/>
              <RangeField icon={PanelTop} label={copy.titlePlacement} unit="%" min="15" max={titleYMax} value={settings.classicTitleY} defaultValue={defaults.classicTitleY} onChange={value => update("classicTitleY", value)}/>
            </>}
            {band && <RangeField icon={Ruler} label={copy.bandHeight} unit="%" min="15" max="50" value={settings.bandHeight} defaultValue={defaults.bandHeight} onChange={value => update("bandHeight", value)}/>}
            {essentials && <RangeField icon={Ruler} label={copy.bandHeight} unit="%" min="27" max="42" value={settings.bandHeight} defaultValue={defaults.bandHeight} onChange={value => update("bandHeight", value)}/>}
          </Section>}

          {/* 4. Colors. */}
          <Section title={copy.colors}>
            {!thisIs && <ColorField copy={copy} icon={Brush} label={newDailyMix ? copy.textColor : copy.textAndLogo} value={settings.textColor} onChange={value => update("textColor", value)}/>}
            {band && settings.showLogo && <label className="toggle-row"><RowLabel icon={Link}>{copy.logoMatchesBand}</RowLabel><DragToggle checked={settings.logoMatchesBand} onChange={value => update("logoMatchesBand", value)}/></label>}
            {(essentials || band) && <ColorField copy={copy} icon={PaintBucket} label={copy.bandColor} value={settings.bandColor} onChange={value => update("bandColor", value)}/>}
            {thisIs && <ColorField copy={copy} icon={Droplet} label={copy.accentColor} value={settings.bandColor} onChange={value => update("bandColor", value)}/>}
            {dailyMix && <ColorField copy={copy} icon={newDailyMix ? Droplet : PaintBucket} label={newDailyMix ? copy.accentColor : copy.overlayColor} value={settings.bandColor} onChange={value => update("bandColor", value)}/>}
            {dailyMix && !newDailyMix && <RangeField icon={Layers2} label={copy.colorOpacity} unit="%" min="0" max="100" value={settings.dailyMixTintOpacity} defaultValue={defaults.dailyMixTintOpacity} onChange={value => update("dailyMixTintOpacity", value)}/>}
          </Section>

          {/* 5. Photo or background. Similar Artist Radio: the main artist uses the regular photo controls, the others get their own photo and crop. */}
          {artists && <Section title={copy.artists}>
            <SegmentField icon={Users} label={copy.artistCount} value={settings.artistCount} options={([1, 2, 3] as const).map(n => [n, String(n)] as const)} onChange={value => update("artistCount", value)}/>
            <div className="field-label"><RowLabel icon={UserRound}>{copy.mainArtist}</RowLabel></div>
            <PhotoControls copy={copy} photo={photo} photoName={photoName} uploading={uploading} dragging={dragging} setDragging={setDragging} fileInput={fileInput} upload={upload} onRemove={() => { uploadId.current++; setUploading(false); setPhoto(null); setPhotoName(""); }} settings={settings} update={update} showPhotoFrame={false}/>
            {[0, 1].slice(0, settings.artistCount - 1).map(i => <ArtistPhotoControls key={i} copy={copy} label={copy.artistN(i + 2)} photo={artistPhotos[i]} photoName={artistNames[i]} uploading={artistUploading[i]} upload={file => uploadArtist(i, file)} onRemove={() => removeArtist(i)} look={artistLookAt(settings.artistLooks, i)} onChange={patch => updateArtistLook(i, patch)}/>)}
          </Section>}

          {/* 5. Photo or background. */}
          {(essentials || thisIs || band || dailyMix) && <Section title={copy.yourPhoto}>
            <PhotoControls showPhotoFrame={essentials || band} topMarginLabel={band ? copy.bandEdgeMargin : copy.includeTopMargin} copy={copy} photo={photo} photoName={photoName} uploading={uploading} dragging={dragging} setDragging={setDragging} fileInput={fileInput} upload={upload} onRemove={() => { uploadId.current++; setUploading(false); setPhoto(null); setPhotoName(""); }} settings={settings} update={update} updatePhotoFrame={updatePhotoFrame} photoFrameChanged={photoFrameChanged} resetPhotoFrame={resetPhotoFrame}/>
          </Section>}

          {(classic || fullPhoto || artists) && <Section title={copy.background}>
            <DraggableSegments className="segmented">{([['gradients', copy.gradient, Blend],['custom', copy.color, Palette],['picture', copy.picture, ImageIcon]] as const).filter(([value]) => !artists || value !== "picture").map(([value,label,Icon]) => <button key={value} className={backgroundType === value ? "active" : ""} aria-pressed={backgroundType === value} onClick={() => update(backgroundKey, value)}><Icon size={14} aria-hidden="true"/>{label}</button>)}</DraggableSegments>
            {backgroundType === "picture" ? <PhotoControls copy={copy} photo={photo} photoName={photoName} uploading={uploading} dragging={dragging} setDragging={setDragging} fileInput={fileInput} upload={upload} onRemove={() => { uploadId.current++; setUploading(false); setPhoto(null); setPhotoName(""); }} settings={settings} update={update} showPhotoFrame={false}/> : backgroundType === "custom" ? <>
              <ColorField copy={copy} icon={PaintBucket} label={copy.backgroundColor} value={settings.customColor} onChange={value => update("customColor", value)}/>
              <label className="toggle-row"><RowLabel icon={Eclipse}>{copy.colorShadow}</RowLabel><DragToggle checked={settings.colorShadow} onChange={value => update("colorShadow", value)}/></label>
              {settings.colorShadow && <label className="field select-field"><RowLabel icon={Spline}>{copy.gradientType}</RowLabel><span className="select-wrap"><select value={settings.gradientType} onChange={e => update("gradientType", e.target.value as typeof settings.gradientType)}>{GRADIENT_TYPES.map(type => <option key={type} value={type}>{copy.gradientTypes[type]}</option>)}</select></span></label>}
            </> : <div className="swatches">{Array.from({ length: 40 }, (_, i) => { const name = copy.gradientN(i + 1); const selected = settings.gradient === i; return <button key={`${backgroundType}-${i}`} title={name} aria-label={name} aria-pressed={selected} className={`swatch ${selected ? "selected" : ""}`} onClick={() => update("gradient", i)}><img src={`/assets/gradients/${i}.png`} alt=""/></button>; })}</div>}
          </Section>}

          {/* 6. Logo. */}
          <Section title={spotify ? copy.spotifyLogo : copy.appleLogo} last>
            <label className="toggle-row"><RowLabel icon={Eye}>{copy.showLogo}</RowLabel><DragToggle checked={settings.showLogo} onChange={value => update("showLogo", value)}/></label>
            {settings.showLogo && !thisIs && !band && !essentials && !artists && !dailyMix && <><div className="field-label"><RowLabel icon={Grid2x2}>{copy.logoPosition}</RowLabel></div><div className="corner-options">{corners.map(corner => { const active = logoCornerFor(settings.mode, settings.corner) === corner; const titleTaken = corner === takenCorner; return <button key={corner} disabled={titleTaken} className={active ? "active" : ""} aria-pressed={active} title={titleTaken ? copy.titleCornerHint : undefined} onClick={() => setSettings(s => ({ ...s, corner }))}><span className={`corner-icon ${corner}`}><i/></span>{copy.corners[corner]}</button>; })}</div></>}
            {!spotify && settings.showLogo && <><div className="field-label"><RowLabel icon={Shapes}>{copy.logoStyle}</RowLabel></div><div className="style-options logo-style-options" role="group" aria-label={copy.logoStyle}>
              {(["classic", "new"] as const).map(value => { const logo = appleLogoShape(value); const name = value === "classic" ? copy.logoClassic : copy.logoNew; return <button key={value} className={`style-option ${settings.appleLogo === value ? "selected" : ""}`} aria-pressed={settings.appleLogo === value} aria-label={`${copy.logoStyle}: ${name}`} onClick={() => update("appleLogo", value)}><span className="platform-logo" aria-hidden="true"><svg viewBox={`0 0 ${logo.width} ${logo.height}`}><path d={logo.path}/></svg></span><strong>{name}</strong></button>; })}
            </div></>}
          </Section>
        </section>
      </div>
      <ConfirmDialog open={confirmingReset} title={copy.resetCoverTitle} body={copy.resetCoverBody} confirmLabel={copy.resetCoverConfirm}
        cancelLabel={copy.cancel} onConfirm={throwAndReset} onClose={() => setConfirmingReset(false)}/>
      <ConfirmDialog open={confirmingDelete} title={copy.deleteAllTitle} body={copy.deleteAllBody(memories.length)} confirmLabel={copy.deleteAllConfirm}
        cancelLabel={copy.cancel} onConfirm={deleteAllMemories} onClose={() => setConfirmingDelete(false)}/>
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

/** A settings category: a small title above one grouped card whose rows are separated by hairlines. */
function Section({ title, className = "", last = false, children }: { title: string; className?: string; last?: boolean; children: ReactNode }) {
  return <section className={`control-section ${className}${last ? " last-section" : ""}`}><div className="section-heading"><h2>{title}</h2></div><div className="section-body">{children}</div></section>;
}

/** Mix number input: typing updates the cover on every valid number (clamped to 1–99); an empty or invalid entry snaps back to the current number on blur. */
function MixNumberField({ icon, label, value, onChange }: { icon?: LucideIcon; label: string; value: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(current => parseMixNumber(current) === value ? current : String(value)); }, [value]);
  return <label className="field"><RowLabel icon={icon}>{label}</RowLabel><input type="number" inputMode="numeric" min={1} max={DAILY_MIX_MAX} step={1} value={draft}
    onChange={e => { setDraft(e.target.value); const next = parseMixNumber(e.target.value); if (next !== null) onChange(next); }}
    onBlur={() => setDraft(String(value))}/></label>;
}

/** Row label: a small leading icon, then the text. */
function RowLabel({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return <span className="row-label">{Icon && <Icon size={15} aria-hidden="true"/>}<span>{children}</span></span>;
}

/** A text input; `multiline` lets Enter add a line break, growing one row per line. */
function TextField({ icon, label, value, onChange, placeholder, maxLength = 100, multiline = false }: { icon?: LucideIcon; label: string; value: string; onChange: (value: string) => void; placeholder?: string; maxLength?: number; multiline?: boolean }) {
  const input = multiline
    ? <textarea rows={value.split("\n").length} maxLength={maxLength} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>
    : <input maxLength={maxLength} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>;
  return <label className="field"><RowLabel icon={icon}>{label}</RowLabel>{input}</label>;
}

/** A labelled slider; double-clicking its thumb glides it back to `defaultValue`. */
function RangeField({ icon, label, value, defaultValue, unit, min, max, step = "1", onChange }: { icon?: LucideIcon; label: string; value: number; defaultValue: number; unit: string; min: number | string; max: number | string; step?: string; onChange: (value: number) => void }) {
  return <label className="range-label"><RowLabel icon={icon}>{label}</RowLabel><span className="range-value">{value}{unit}</span><SmoothRange min={min} max={max} step={step} value={value} defaultValue={defaultValue} onValueChange={onChange}/></label>;
}

function SegmentField<T extends string | number | boolean>({ icon, label, value, options, onChange, className = "", optionClass }: { icon?: LucideIcon; label: string; value: T; options: readonly (readonly [T, string, LucideIcon?])[]; onChange: (value: T) => void; className?: string; optionClass?: (value: T) => string }) {
  return <div className="inline-row"><div className="field-label"><RowLabel icon={icon}>{label}</RowLabel></div><DraggableSegments className={`segmented ${className}`}>{options.map(([option, text, Icon]) => <button key={String(option)} className={`${value === option ? "active" : ""} ${optionClass?.(option) ?? ""}`} aria-pressed={value === option} onClick={() => onChange(option)}>{Icon && <Icon size={14} aria-hidden="true"/>}{text}</button>)}</DraggableSegments></div>;
}

type ColorPreset = { label: string; hex: string };

/** Color row: a rainbow "custom" swatch that opens the system picker, then preset swatches. */
function ColorField({ copy, icon, label, value, onChange, presets }: { copy: Dictionary["editor"]; icon?: LucideIcon; label: string; value: string; onChange: (value: string) => void; presets?: readonly ColorPreset[] }) {
  const options = presets ?? BASIC_COLORS.map(([name, hex]) => ({ label: copy.colorNames[name], hex }));
  const selected = findPreset(value, options.map(option => option.hex));
  return <div className="color-control">
    <RowLabel icon={icon}>{label}</RowLabel>
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
    case "similar-artists": return [copy.similarArtists, copy.similarArtistsHint];
    case "spotify-this-is": return [copy.thisIs, copy.thisIsHint];
    case "spotify-band": return [copy.spotifyBand, copy.spotifyBandHint];
    case "spotify-photo": return [copy.spotifyPhoto, copy.spotifyPhotoHint];
    case "spotify-daily-mix": return [copy.dailyMix, copy.dailyMixHint];
  }
}

/** Style thumbnails draw each style's default cover in miniature: the same elements, colors, and positions as the 1200px canvas, scaled with container units. */
function StyleThumb({ mode, copy }: { mode: CoverMode; copy: Dictionary["editor"] }) {
  const apple = appleLogoShape("classic");
  const appleMark = <svg className="thumb-logo apple" viewBox={`0 0 ${apple.width} ${apple.height}`}><path d={apple.path}/></svg>;
  const spotifyMark = <svg className="thumb-logo spotify" viewBox="0 0 24 24"><path d={SPOTIFY_PATH} fillRule="evenodd"/></svg>;
  if (mode === "classic") return <span className="style-thumb thumb-classic" aria-hidden="true">{appleMark}<b>{copy.sampleTitle}</b><span>{copy.sampleSubtitle}</span><small>{copy.sampleFooter}</small></span>;
  if (mode === "essentials") return <span className="style-thumb thumb-essentials" aria-hidden="true"><i/>{appleMark}<b>{copy.sampleEssentials}</b></span>;
  if (mode === "similar-artists") return <span className="style-thumb thumb-artists" aria-hidden="true">{appleMark}<i/><em/><span/></span>;
  if (mode === "spotify-this-is") return <span className="style-thumb thumb-this-is" aria-hidden="true">{spotifyMark}<em>THIS IS</em><i/><b>{copy.sampleTitle}</b></span>;
  if (mode === "spotify-band") return <span className="style-thumb thumb-band" aria-hidden="true"><i/>{spotifyMark}<b>{copy.sampleTitle}</b></span>;
  if (mode === "spotify-daily-mix") return <span className="style-thumb thumb-daily-mix" aria-hidden="true"><svg className="thumb-wave" viewBox="0 0 1200 1200"><defs><linearGradient id="thumb-daily-mix-photo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#777"/><stop offset="1" stopColor="#262629"/></linearGradient></defs><rect width="1200" height="1200" fill="url(#thumb-daily-mix-photo)"/><path d={`M0 0H1200V1200H0Z${DAILY_MIX_WAVE}`} fill="#f06e94" fillOpacity={DAILY_MIX_TINT_OPACITY / 100} fillRule="evenodd"/></svg>{spotifyMark}<b>Daily Mix 1</b></span>;
  return <span className="style-thumb thumb-photo" aria-hidden="true">{spotifyMark}<b>{copy.sampleTitle}</b></span>;
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
    {showPhotoFrame && updatePhotoFrame && resetPhotoFrame && <div className="photo-frame-controls"><div className="field-label"><RowLabel icon={Frame}>{copy.photoFrame}</RowLabel><button className="icon-button" title={copy.resetPhotoFrame} aria-label={copy.resetPhotoFrame} disabled={!photoFrameChanged} onClick={resetPhotoFrame}><RotateCcw size={14}/></button></div><label className="range-label"><RowLabel icon={FoldHorizontal}>{copy.sideMargin}</RowLabel><span className="range-value">{settings.photoMargin}%</span><SmoothRange min="0" max="12" step="1" value={settings.photoMargin} defaultValue={defaults.photoMargin} onValueChange={value => updatePhotoFrame("photoMargin", value)}/></label><label className="toggle-row compact frame-toggle"><RowLabel icon={PanelTopDashed}>{topMarginLabel}</RowLabel><DragToggle checked={settings.photoTopMargin} onChange={value => update("photoTopMargin", value)}/></label><label className="range-label"><RowLabel icon={Squircle}>{copy.roundedCorners}</RowLabel><span className="range-value">{settings.photoRadius}%</span><SmoothRange min="0" max="10" step="1" value={settings.photoRadius} defaultValue={defaults.photoRadius} onValueChange={value => updatePhotoFrame("photoRadius", value)}/></label></div>}
    <PhotoTreatmentControls copy={copy} value={settings} start={treatmentDefaults(settings.mode, settings.dailyMixDesign)} onChange={patch => (Object.keys(patch) as (keyof typeof patch)[]).forEach(key => update(key, patch[key]!))}/>
    <div className="crop-controls"><label className="range-label"><RowLabel icon={ZoomIn}>{copy.zoom}</RowLabel><span className="range-value">{settings.zoom.toFixed(1)}×</span><SmoothRange min="1" max="3" step="0.05" value={settings.zoom} defaultValue={defaults.zoom} onValueChange={value => update("zoom", value)}/></label><label className="range-label"><RowLabel icon={MoveHorizontal}>{copy.horizontal}</RowLabel><span className="range-value">{settings.offsetX}%</span><SmoothRange min="0" max="100" value={settings.offsetX} defaultValue={defaults.offsetX} onValueChange={value => update("offsetX", value)}/></label><label className="range-label"><RowLabel icon={MoveVertical}>{copy.vertical}</RowLabel><span className="range-value">{settings.offsetY}%</span><SmoothRange min="0" max="100" value={settings.offsetY} defaultValue={defaults.offsetY} onValueChange={value => update("offsetY", value)}/></label></div>
    </> : <p className="help-text">{copy.photoHelp}</p>}
  </>;
}

/** Photo, treatment, and crop for a second or third artist bubble in Similar Artist Radio: the same treatments as the main artist, set separately. */
function ArtistPhotoControls({ copy, label, photo, photoName, uploading, upload, onRemove, look, onChange }: {
  copy: Dictionary["editor"];
  label: string;
  photo: string | null;
  photoName: string;
  uploading: boolean;
  upload: (file?: File) => Promise<void>;
  onRemove: () => void;
  look: ArtistLook;
  onChange: (patch: Partial<ArtistLook>) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return <div className="artist-photo">
    <div className="field-label"><RowLabel icon={UserRound}>{label}</RowLabel></div>
    <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden-input" aria-label={`${label}: ${copy.uploadPhoto}`} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }}/>
    <button className={`upload-zone ${dragging ? "dragging" : ""}`} onClick={() => fileInput.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files[0]); }}><ImagePlus size={23}/><strong>{uploading ? copy.openingPhoto : photo ? copy.replacePhoto : copy.addPhoto}</strong><span>{copy.dropPhoto}</span><small>{copy.photoTypes}</small></button>
    {photo && <>
      <div className="file-row"><span>{photoName}</span><button className="icon-button" aria-label={`${label}: ${copy.removePhoto}`} onClick={onRemove}><X size={14}/></button></div>
      <PhotoTreatmentControls copy={copy} value={look} start={DEFAULT_ARTIST_LOOK} onChange={onChange}/>
      <div className="crop-controls"><label className="range-label"><RowLabel icon={ZoomIn}>{copy.zoom}</RowLabel><span className="range-value">{look.zoom.toFixed(1)}×</span><SmoothRange min="1" max="3" step="0.05" value={look.zoom} defaultValue={DEFAULT_ARTIST_LOOK.zoom} onValueChange={value => onChange({ zoom: value })}/></label><label className="range-label"><RowLabel icon={MoveHorizontal}>{copy.horizontal}</RowLabel><span className="range-value">{look.offsetX}%</span><SmoothRange min="0" max="100" value={look.offsetX} defaultValue={DEFAULT_ARTIST_LOOK.offsetX} onValueChange={value => onChange({ offsetX: value })}/></label><label className="range-label"><RowLabel icon={MoveVertical}>{copy.vertical}</RowLabel><span className="range-value">{look.offsetY}%</span><SmoothRange min="0" max="100" value={look.offsetY} defaultValue={DEFAULT_ARTIST_LOOK.offsetY} onValueChange={value => onChange({ offsetY: value })}/></label></div>
    </>}
  </div>;
}

type TreatmentValue = Pick<ArtistLook, "treatment" | "tint" | "brightness" | "contrast">;

/** Photo treatment (original, mono, duotone with its tint), brightness, and contrast, with a reset back to `start`. */
function PhotoTreatmentControls({ copy, value, start, onChange }: { copy: Dictionary["editor"]; value: TreatmentValue; start: TreatmentValue; onChange: (patch: Partial<TreatmentValue>) => void }) {
  return <>
    <div className="inline-row"><div className="field-label photo-treatment-label"><RowLabel icon={SlidersHorizontal}>{copy.photoTreatment}</RowLabel><button className="icon-button" title={copy.resetPhotoTreatment} aria-label={copy.resetPhotoTreatment} disabled={!treatmentDiffers(start, value)} onClick={() => onChange({ treatment: start.treatment, tint: start.tint, brightness: start.brightness, contrast: start.contrast })}><RotateCcw size={14}/></button></div><DraggableSegments className="segmented treatments">{([['original', copy.originalTreatment, ImageIcon],['mono', copy.mono, Contrast],['duotone', copy.duotone, Droplets]] as const).map(([option,label,Icon]) => <button key={option} aria-pressed={value.treatment === option} className={value.treatment === option ? "active" : ""} onClick={() => onChange({ treatment: option })}><Icon size={14} aria-hidden="true"/>{label}</button>)}</DraggableSegments></div>
    {value.treatment === "duotone" && <ColorField copy={copy} icon={Droplets} label={copy.duotoneTint} value={value.tint} presets={tintColors.map(hex => ({ label: copy.duotoneColor(hex), hex }))} onChange={tint => onChange({ tint })}/>}
    <div className="photo-tone-controls"><label className="range-label"><RowLabel icon={Sun}>{copy.brightness}</RowLabel><span className="range-value">{value.brightness > 0 ? `+${value.brightness}` : value.brightness}</span><SmoothRange min="-100" max="100" step="1" value={value.brightness} defaultValue={start.brightness} onValueChange={brightness => onChange({ brightness })}/></label><label className="range-label"><RowLabel icon={SunMoon}>{copy.contrast}</RowLabel><span className="range-value">{value.contrast > 0 ? `+${value.contrast}` : value.contrast}</span><SmoothRange min="-100" max="100" step="1" value={value.contrast} defaultValue={start.contrast} onValueChange={contrast => onChange({ contrast })}/></label></div>
  </>;
}
