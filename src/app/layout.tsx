import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppToaster } from "@/components/AppToaster";

const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("theme") || "system";
    var resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    var root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  } catch (_) {}
})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soundhoreg.info";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "SOUND HOREG.INFO",
    template: "%s | SOUND HOREG.INFO",
  },
  description: "Sound Horeg Early Warning System - Pantau jadwal dan peta acara Sound Horeg di sekitarmu dengan mudah dan akurat.",
  keywords: ["Sound Horeg", "Jadwal Sound Horeg", "EWS Sound Horeg", "Karnaval Sound", "Info Sound Horeg", "Peta Sound Horeg", "Jawa Timur"],
  authors: [{ name: "Sound Horeg Info" }],
  creator: "Sound Horeg Info",
  publisher: "Sound Horeg Info",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: appUrl,
    title: "SOUND HOREG.INFO",
    description: "Sound Horeg Early Warning System - Pantau jadwal dan peta acara Sound Horeg di sekitarmu dengan mudah.",
    siteName: "SOUND HOREG.INFO",
  },
  twitter: {
    card: "summary_large_image",
    title: "SOUND HOREG.INFO",
    description: "Sound Horeg Early Warning System - Pantau jadwal dan peta acara Sound Horeg di sekitarmu dengan mudah.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SOUND HOREG.INFO",
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {THEME_BOOTSTRAP_SCRIPT}
        </Script>
        <ThemeProvider>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
