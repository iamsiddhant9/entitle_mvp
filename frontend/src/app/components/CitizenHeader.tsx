"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useCitizen } from "@/context/CitizenProfileContext";

interface Props {
  title?: string;
  subtitle?: string;
}

export default function CitizenHeader({ title = "ENTITLE", subtitle = "Welfare Entitlement Assistance" }: Props) {
  const { citizenId, profile } = useCitizen();

  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (citizenId) return `ENT-${citizenId.slice(0, 8).toUpperCase()}`;
    return "Guest Citizen";
  };

  return (
    <header className="bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
          <div className="w-11 h-11 border-2 flex items-center justify-center font-bold text-xl rounded-sm shadow-sm" style={{ borderColor: "#0B3CC8", color: "#0B3CC8" }}>E</div>
          <div>
            <div className="text-xl font-bold tracking-tight" style={{ color: "#0B3CC8" }}>{title}</div>
            <div className="text-[11px] text-[#64748B] mt-0.5 font-medium hidden sm:block">{subtitle}</div>
          </div>
        </Link>
        <Link href="/profile" className="flex items-center gap-3 group">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-[#0F172A] group-hover:text-[#0B3CC8] transition-colors">
              {getDisplayName()}
            </div>
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">
              {citizenId ? "Active Session" : "No Session"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F1F5F9] group-hover:bg-[#EEF3FF] transition-colors border border-[#E2E8F0] group-hover:border-[#0B3CC8] shadow-sm">
            <User className="w-5 h-5 text-[#475569] group-hover:text-[#0B3CC8] transition-colors" />
          </div>
        </Link>
      </div>
    </header>
  );
}
