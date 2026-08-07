import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { DemoBanner } from "@/components/DemoBanner";
import { ErrorBanner } from "@/components/ErrorBanner";
import { AppStateProvider } from "@/features/app/AppStateProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polaris — Privacy-preserving research matching",
  description:
    "Midnight Hack Buenos Aires 2026 MVP: zero-knowledge patient matching and programmable consent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <AppStateProvider>
          <DemoBanner />
          <ErrorBanner />
          <AppNav />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </AppStateProvider>
      </body>
    </html>
  );
}
