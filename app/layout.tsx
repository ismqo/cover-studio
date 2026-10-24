import type { Metadata } from "next";
import { LocaleProvider } from "@/components/locale-provider";
import "./globals.css";

const bootScript = `(function(){try{var e=document.documentElement;var t=localStorage.getItem("cover-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";e.setAttribute("data-theme",t);e.style.colorScheme=t;var l=localStorage.getItem("cover-locale");if(l!=="en"&&l!=="es")l=(navigator.language||"").toLowerCase().indexOf("es")===0?"es":"en";e.lang=l;e.setAttribute("data-locale",l)}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Cover Studio",
  description: "Create your own gradient and Essentials-style playlist covers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
