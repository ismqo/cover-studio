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
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
