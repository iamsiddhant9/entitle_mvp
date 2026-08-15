import type { Metadata } from "next";
import { Open_Sans, Oswald } from "next/font/google";
import "./globals.css";

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
  title: "ENTITLE – Know Your Rights. Claim Your Benefits.",
  description: "An independent AI platform to map your profile to valid central and state welfare schemes in plain language.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${openSans.variable} ${oswald.variable} min-h-full flex flex-col bg-white antialiased`}>{children}</body>
    </html>
  );
}
