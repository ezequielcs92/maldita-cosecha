import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "localhost:3001";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description =
    "Adaptación cooperativa digital del juego de mesa Maldita Cosecha, de Ukelele Games.";

  return {
    title: "Maldita Cosecha Digital",
    description,
    icons: {
      icon: "/marcador-plagas.png",
      shortcut: "/marcador-plagas.png",
    },
    openGraph: {
      title: "Maldita Cosecha Digital",
      description,
      type: "website",
      images: [
        {
          url: new URL("/og.png", origin).toString(),
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
      images: [new URL("/og.png", origin).toString()],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
