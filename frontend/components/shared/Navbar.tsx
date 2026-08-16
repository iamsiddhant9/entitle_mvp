"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/assistant", label: "Check eligibility" },
  { href: "/dashboard", label: "My results" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-saffron to-indiagreen shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            ENTITLE
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3",
                pathname === link.href
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
