import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import { SWRProvider } from "@/components/providers/SWRProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ),
  title: {
    default: "Sentra | RBAC CMS",
    template: "%s | Sentra",
  },
  description:
    "Modern Role-Based Access Control Content Management System built with Next.js, TypeScript, and MongoDB. Manage your content with powerful RBAC architecture.",
  keywords: [
    "CMS",
    "RBAC",
    "Content Management",
    "Next.js",
    "TypeScript",
    "MongoDB",
    "Role-Based Access Control",
    "Authentication",
    "Authorization",
  ],
  authors: [{ name: "Sentra Team" }],
  creator: "Sentra",
  publisher: "Sentra",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    title: "Sentra | RBAC CMS",
    description:
      "Modern Role-Based Access Control Content Management System built with Next.js and TypeScript.",
    siteName: "Sentra CMS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sentra CMS - Role-Based Access Control",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sentra | RBAC CMS",
    description:
      "Modern Role-Based Access Control Content Management System built with Next.js and TypeScript.",
    images: ["/og-image.png"],
    creator: "@sentra",
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
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${montserrat.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <SWRProvider>
          <SessionProviderWrapper>
            <div className="relative min-h-screen flex flex-col">
              {children}
            </div>
          </SessionProviderWrapper>
        </SWRProvider>
        <Toaster />
      </body>
    </html>
  );
}
