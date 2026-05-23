import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "דאשבורד פיננסי | 100K",
  description: "מעקב תקציב ויעדים פיננסיים בדרך ל-100K",
  manifest: "/manifest.json",
  openGraph: {
    title: "דאשבורד פיננסי | 100K",
    description: "מעקב תקציב ויעדים פיננסיים בדרך ל-100K",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "דאשבורד פיננסי | 100K",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "100K Dashboard",
    startupImage: "/og-image.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body
        className="min-h-screen bg-black text-white antialiased"
        style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 700 }}
      >
        {children}
      </body>
    </html>
  );
}
