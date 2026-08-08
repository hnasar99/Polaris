import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { AppProviders } from "@/features/app/AppProviders";
import { DEFAULT_LOCALE, LOCALE_TAGS, es } from "@/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Metadata is rendered on the server, before any stored language preference is
 * readable, so it uses the default locale's dictionary rather than a literal.
 */
export const metadata: Metadata = {
  title: es.meta.title,
  description: es.meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /*
     * Always renders the default locale so server and client agree on the first
     * paint. I18nProvider rewrites documentElement.lang from localStorage after
     * hydration, which is why the attribute is exempted from the check.
     */
    <html lang={LOCALE_TAGS[DEFAULT_LOCALE]} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
