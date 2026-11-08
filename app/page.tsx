"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { APPLE_MUSIC_PATH } from "@/lib/apple-logo";
import { NavMenu } from "@/components/nav-menu";
import { useI18n } from "@/components/locale-provider";
import styles from "./landing.module.css";

const covers = [
  ["After Hours", "THE NIGHT IS YOURS", 1], ["On Repeat", "YOUR DAILY ROTATION", 18],
  ["Sunday\nKind of Love", "SLOW THINGS DOWN", 16], ["Headspace", "ROOM TO BREATHE", 30],
  ["Golden\nHour", "STAY A LITTLE LONGER", 28], ["Pure\nEnergy", "TURN IT UP", 21],
  ["Daydream", "GET LOST IN THE SOUND", 0], ["Deep\nFocus", "IN YOUR ELEMENT", 23],
  ["Feel\nGood", "A LITTLE MORE SUNSHINE", 34], ["Late Night\nDrive", "TAKE THE LONG WAY HOME", 24],
  ["Soft\nSounds", "LESS NOISE. MORE FEELING.", 17], ["Electric", "SOMETHING DIFFERENT", 32],
  ["New\nFavorites", "YOUR NEXT OBSESSION", 19], ["Essentials", "THE ONES THAT STAY", 2],
  ["In Bloom", "A FRESH START", 39], ["Good\nCompany", "BETTER TOGETHER", 14],
  ["Slow\nMornings", "EASE INTO THE DAY", 26], ["No\nSkips", "EVERY TRACK. EVERY TIME.", 6],
] as const;

function Cover({ index }: { index: number }) {
  const [title, subtitle, pattern] = covers[index % covers.length];
  return <div className={`${styles.cover} ${index % 4 === 1 ? styles.centeredCover : ""}`}>
    <img src={`/assets/gradients/${pattern}.png`} alt="" width={300} height={300}/>
    <svg viewBox="0 0 84.3 20.7" className={styles.coverLogo} fill="currentColor"><path d={APPLE_MUSIC_PATH}/></svg>
    <strong>{title}</strong><small>{subtitle}</small>
  </div>;
}

function CoverWall({ empty }: { empty?: boolean }) {
  return <div className={`${styles.wall} ${empty ? styles.emptyWall : ""}`} aria-hidden="true">
    {Array.from({length:6}, (_, column) => <div className={styles.column} key={column} style={{"--column": column} as React.CSSProperties}>
      {[0,1,2].map(copy => <div className={styles.coverGroup} key={copy}>{[0,1,2].map(row => empty
        ? <div key={row} className={`${styles.cover} ${styles.emptyCover}`} data-cover=""/>
        : <Cover key={row} index={column * 3 + row}/>
      )}</div>)}
    </div>)}
  </div>;
}

type Zoom = { left: number; top: number; width: number; height: number; dx: number; dy: number; scale: number; angle: number };

function coverTilt(node: HTMLElement) {
  let angle = window.matchMedia("(max-width: 650px)").matches ? -10 : -9;
  let scale = angle === -10 ? 1 : 1.08;
  let el: HTMLElement | null = node;
  while (el) {
    const transform = getComputedStyle(el).transform;
    if (transform && transform !== "none" && transform.startsWith("matrix(")) {
      const [a, b] = transform.slice(7, -1).split(",").map(Number);
      const nextAngle = Math.atan2(b, a) * 180 / Math.PI;
      if (Math.abs(nextAngle) > 0.2) return { angle: nextAngle, scale: Math.hypot(a, b) };
    }
    el = el.parentElement;
  }
  return { angle, scale };
}

function nearestCover(): Zoom {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  let best: HTMLElement | null = null;
  let bestDist = Infinity;
  for (const node of document.querySelectorAll<HTMLElement>("[data-cover]")) {
    const rect = node.getBoundingClientRect();
    if (rect.width < 8) continue;
    const dist = (rect.left + rect.width / 2 - cx) ** 2 + (rect.top + rect.height / 2 - cy) ** 2;
    if (dist < bestDist) { bestDist = dist; best = node; }
  }
  if (!best) {
    const size = 320;
    return { left: cx - size / 2, top: cy - size / 2, width: size, height: size, dx: 0, dy: 0, scale: Math.max(window.innerWidth, window.innerHeight) / size * 1.2, angle: -9 };
  }
  const rect = best.getBoundingClientRect();
  const { angle, scale: wallScale } = coverTilt(best);
  const size = best.offsetWidth * wallScale;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return {
    left: centerX - size / 2, top: centerY - size / 2, width: size, height: size,
    dx: cx - centerX, dy: cy - centerY,
    scale: Math.max(window.innerWidth / size, window.innerHeight / size) * 1.2,
    angle,
  };
}

export default function Landing() {
  const router = useRouter();
  const { t } = useI18n();
  const [paused, setPaused] = useState(false);
  const [phase, setPhase] = useState<"idle" | "fade" | "blank" | "zoom">("idle");
  const [zoom, setZoom] = useState<Zoom | null>(null);
  const [zoomOn, setZoomOn] = useState(false);
  const departing = phase !== "idle";

  useEffect(() => { router.prefetch("/editor"); }, [router]);

  useEffect(() => {
    if (phase === "idle") return;
    if (phase === "fade") {
      const timer = window.setTimeout(() => setPhase("blank"), 520);
      return () => clearTimeout(timer);
    }
    if (phase === "blank") {
      const timer = window.setTimeout(() => setPhase("zoom"), 980);
      return () => clearTimeout(timer);
    }
    let cancelled = false;
    const box = nearestCover();
    setZoom(box);
    const expandFrame = requestAnimationFrame(() => { if (!cancelled) setZoomOn(true); });
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      document.documentElement.dataset.enter = "editor";
      const page = getComputedStyle(document.documentElement).getPropertyValue("--page").trim() || "#f5f5f7";
      document.documentElement.style.background = page;
      document.body.style.background = page;
      router.push("/editor");
    }, 980);
    return () => {
      cancelled = true;
      cancelAnimationFrame(expandFrame);
      clearTimeout(timer);
    };
  }, [phase, router]);

  function openEditor(event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;
    event.preventDefault();
    if (phase !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push("/editor");
      return;
    }
    setPhase("fade");
  }

  return <div className={`${styles.landing} ${departing ? styles.departing : ""} ${phase === "blank" || phase === "zoom" ? styles.blank : ""} ${phase === "zoom" ? styles.zooming : ""}`}>
    <header className={`${styles.navbar} liquid-nav liquid-nav--landing`}>
      <nav aria-label={t.nav.main}>
        <Link href="/" className={styles.wordmark} aria-label={t.nav.home}>Cover<span className="studio-label">STUDIO</span></Link>
        <div className={styles.navActions}><NavMenu /></div>
      </nav>
    </header>

    <main className={`${styles.hero} ${paused ? styles.paused : ""}`}>
      <CoverWall/>
      <CoverWall empty/>
      <div className={styles.shade}/>
      <section className={styles.heroContent} aria-labelledby="hero-title">
        <div className={styles.heroBrand}>Cover Studio</div>
        <h1 id="hero-title">{t.landing.titleLead}<br/>{t.landing.titleRest}</h1>
        <p>{t.landing.body}<br className={styles.mobileBreak}/> {t.landing.bodyRest}</p>
        <a href="/editor" className={styles.heroCta} onClick={openEditor}>{t.landing.cta}</a>
      </section>
      <div className={styles.bottomBar}><span>{t.landing.caption}</span><button className={styles.motionButton} onClick={() => setPaused(p => !p)} aria-label={paused ? t.landing.play : t.landing.pause} aria-pressed={paused}>{paused ? <Play size={16} fill="currentColor"/> : <Pause size={16} fill="currentColor"/>}</button></div>
    </main>
    {zoom && <div className={`${styles.zoomCover} ${zoomOn ? styles.zoomCoverOn : ""}`} style={{ left: zoom.left, top: zoom.top, width: zoom.width, height: zoom.height, transform: zoomOn ? `translate(${zoom.dx}px, ${zoom.dy}px) rotate(0deg) scale(${zoom.scale})` : `translate(0px, 0px) rotate(${zoom.angle}deg) scale(1)` }}/>}
  </div>;
}
