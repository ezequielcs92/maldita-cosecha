import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PwaRegister from "./pwa-register";
import "./globals.css";
import "./game-polish.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteOrigin =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ??
  "https://maldita-cosecha-digital.mcontreras16.chatgpt.site";
const siteUrl = `${siteOrigin}${basePath}`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#183b25",
};

const description =
  "Adaptación cooperativa digital del juego de mesa Maldita Cosecha, de Ukelele Games.";

export const metadata: Metadata = {
    title: "Maldita Cosecha Digital",
    description,
    manifest: `${basePath}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Maldita Cosecha",
    },
    icons: {
      icon: `${basePath}/marcador-plagas.png`,
      shortcut: `${basePath}/marcador-plagas.png`,
      apple: `${basePath}/icons/apple-touch-icon.png`,
    },
    openGraph: {
      title: "Maldita Cosecha Digital",
      description,
      type: "website",
      images: [
        {
          url: `${siteUrl}/og-v2.png`,
          width: 1536,
          height: 1024,
          alt: "Maldita Cosecha Digital",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Maldita Cosecha Digital",
      description,
      images: [`${siteUrl}/og-v2.png`],
    },
  };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{
          "--field-background": `url("${basePath}/cards/Campo de juego/campo.jpg")`,
          "--og-background": `url("${basePath}/og-v2.png")`,
        } as CSSProperties}
      >
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
