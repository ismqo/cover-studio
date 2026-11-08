import type { Metadata } from "next";
import { LocaleProvider } from "@/components/locale-provider";
import "./globals.css";

const bootScript = `(function(){try{var e=document.documentElement;var l=localStorage.getItem("cover-locale");if(l!=="en"&&l!=="es")l=(navigator.language||"").toLowerCase().indexOf("es")===0?"es":"en";e.lang=l;e.setAttribute("data-locale",l)}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Cover Studio",
  description: "Create your own gradient and Essentials-style playlist covers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
          <filter id="liquid-nav-distortion" x="-20%" y="-50%" width="140%" height="200%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.08" numOctaves="2" seed="8" result="waves" />
            <feDisplacementMap in="SourceGraphic" in2="waves" scale="7" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
