import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";

import { PwaRegistrar } from "@/components/pwa/PwaRegistrar";

import "./globals.css";

const bodyFont = Chakra_Petch({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
});

const headingFont = IBM_Plex_Mono({
  variable: "--font-head",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Langues | Vocabulary Lab",
  description: "Hoc tu vung EN/RU va nghe phat am truc tiep tren mobile.",
  applicationName: "Langues",
  appleWebApp: {
    capable: true,
    title: "Langues",
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0a140f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
