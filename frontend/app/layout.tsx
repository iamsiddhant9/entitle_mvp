import type { Metadata } from "next";
import "./globals.css";
import { CitizenProfileProvider } from "@/context/CitizenProfileContext";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export const metadata: Metadata = {
  title: "ENTITLE — Know What You're Entitled To",
  description:
    "AI-powered eligibility checks for 12 Indian government welfare schemes — deterministic rules, plain-language explanations in English and Hindi, and blockchain-verified certificates.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 antialiased">
        <CitizenProfileProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </CitizenProfileProvider>
      </body>
    </html>
  );
}
