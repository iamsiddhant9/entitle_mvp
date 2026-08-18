import type { Metadata } from "next";
import { Open_Sans, Oswald } from "next/font/google";
import "./globals.css";
import { CitizenProfileProvider } from "@/context/CitizenProfileContext";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://entitle-mvp.vercel.app"),
  title: "ENTITLE – Know Your Rights. Claim Your Benefits.",
  description: "An independent AI platform to map your profile to valid central and state welfare schemes in plain language.",
  openGraph: {
    title: "ENTITLE – Know Your Rights. Claim Your Benefits.",
    description: "An independent AI platform to map your profile to valid central and state welfare schemes in plain language.",
    url: "https://entitle-mvp.vercel.app/",
    siteName: "ENTITLE",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ENTITLE - AI Welfare Platform",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ENTITLE – Know Your Rights. Claim Your Benefits.",
    description: "An independent AI platform to map your profile to valid central and state welfare schemes in plain language.",
    images: ["/og-image.png"],
  },
};

import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${openSans.variable} ${oswald.variable} min-h-full flex flex-col bg-white antialiased`}>
        <Script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="lazyOnload" />
        <Script id="google-translate-init" strategy="lazyOnload">
          {`
            window.googleTranslateElementInit = function() {
              new google.translate.TranslateElement({pageLanguage: 'en', autoDisplay: false}, 'google_translate_element');
            }
          `}
        </Script>
        <CitizenProfileProvider>
          {children}
        </CitizenProfileProvider>
      </body>
    </html>
  );
}
