import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/Toaster";
import { ServiceWorkerRegister } from "@/components/Pwa";
import { I18nProvider } from "@/i18n/client";
import { getLocale, getT, getTheme } from "@/i18n/server";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin", "latin-ext"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin", "latin-ext"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getT()).landing;
  return {
    title: { default: t.metaTitle, template: "%s · CareerPilot" },
    description: t.metaDescription,
    applicationName: "CareerPilot",
    // Installed on an iPhone home screen it opens full screen, named "CareerPilot".
    appleWebApp: { capable: true, title: "CareerPilot", statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f5fb" },
    { media: "(prefers-color-scheme: dark)", color: "#050913" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  return (
    <html
      lang={locale}
      data-theme={theme === "system" ? undefined : theme}
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <I18nProvider locale={locale} theme={theme}>
          {children}
          <Toaster />
          <ServiceWorkerRegister />
        </I18nProvider>
      </body>
    </html>
  );
}
