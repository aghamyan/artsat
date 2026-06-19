import React from "react";
import type { Metadata, Viewport } from "next";
import { Jost, Bodoni_Moda } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { SITE_NAME } from "@/lib/constants";
import { GA4Provider } from "@/components/analytics/GA4Provider";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "Premium clothing for every style. Shop the latest collections at Artsat Clothing.",
  keywords: ["clothing", "fashion", "apparel", "artsat"],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jost.variable} ${bodoniModa.variable} font-sans`}>
        {children}
        <Toaster richColors position="top-right" />
        <GA4Provider />
      </body>
    </html>
  );
}
