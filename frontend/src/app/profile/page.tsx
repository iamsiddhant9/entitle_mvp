"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import {
  User, ShieldCheck, MapPin, Briefcase, IndianRupee,
  Activity, Users, Hash, Clock
} from "lucide-react";
import { useCitizen } from "@/context/CitizenProfileContext";
import { getCitizenProfile, CitizenProfile, ApiError } from "@/lib/api";

function ProfilePageInner() {
  const { citizenId } = useCitizen();
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!citizenId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const data = await getCitizenProfile(citizenId as string);
        setProfile(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [citizenId]);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-open-sans), sans-serif", background: "#F3F4F6" }}>
      {/* Tricolor bar */}
      <div className="flex h-[5px] w-full">
        <div className="flex-1" style={{ background: "#FF9933" }} />
        <div className="flex-1" style={{ background: "#FFFFFF", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }} />
        <div className="flex-1" style={{ background: "#138808" }} />
      </div>

      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-11 h-11 border-2 flex items-center justify-center font-bold text-xl" style={{ borderColor: "#0B3CC8", color: "#0B3CC8" }}>E</div>
            <div>
              <div className="text-xl font-bold tracking-tight" style={{ color: "#0B3CC8" }}>ENTITLE</div>
              <div className="text-[11px] text-[#64748B] mt-0.5 font-medium">Welfare Entitlement Assistance</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#EEF3FF" }}>
              <User className="w-5 h-5" style={{ color: "#0B3CC8" }} />
            </div>
            <div className="text-sm font-semibold text-[#0F172A]">
              {citizenId ? `ENT-${citizenId.slice(0, 8).toUpperCase()}` : "No session"}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 flex items-center">
          <nav className="flex items-center overflow-x-auto">
            {[
              ["Overview", "/", false],
              ["My Profile", "/profile", true],
              ["My determination", "/dashboard", false],
              ["Documents", "/documents", false],
            ].map(([n, h, active]) => (
              <Link
                key={n as string}
                href={h as string}
                className={`relative px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${active ? "text-[#0B3CC8]" : "text-[#475569] hover:text-[#0B3CC8]"}`}
              >
                {n}
                {active && <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "#0B3CC8" }} />}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-[2rem] font-bold text-[#0F172A] tracking-tight">Citizen Profile</h1>
          <p className="text-[#64748B] mt-1">
            Data aggregated from your assessment answers and verified document uploads.
          </p>
        </div>

        {!citizenId ? (
          <div className="bg-white border border-[#E2E8F0] rounded-sm p-12 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto text-[#0B3CC8] mb-4" />
            <h2 className="text-lg font-bold text-[#0F172A] mb-2">No active session</h2>
            <p className="text-[#64748B] mb-6">You need to complete the assessment first to generate a profile.</p>
            <Link href="/assistant">
              <button className="px-6 py-2.5 text-white font-semibold rounded-sm shadow text-sm" style={{ background: "#0B3CC8" }}>
                Start Assessment
              </button>
            </Link>
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-[#64748B] font-medium animate-pulse">Loading profile data...</div>
        ) : error ? (
          <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] p-4 rounded-sm text-sm font-medium">
            {error}
          </div>
        ) : profile ? (
          <div className="bg-white border border-[#E2E8F0] rounded-sm shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B]">Session ID</p>
                <div className="font-mono text-sm text-[#0F172A] font-semibold mt-0.5">{profile.citizen_id}</div>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B]">Last Updated</p>
                <div className="text-sm text-[#0F172A] font-semibold mt-0.5">
                  {new Date(profile.updated_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <ProfileItem icon={<User />} label="Age" value={profile.age ? `${profile.age} years` : "Not provided"} />
              <ProfileItem icon={<Users />} label="Gender" value={profile.gender ? capitalize(profile.gender) : "Not provided"} />
              <ProfileItem icon={<MapPin />} label="State" value={profile.state || "Not provided"} />
              <ProfileItem icon={<Hash />} label="Caste Category" value={profile.caste ? profile.caste.toUpperCase() : "Not provided"} />
              <ProfileItem icon={<Briefcase />} label="Occupation" value={profile.occupation ? capitalize(profile.occupation.replace('_', ' ')) : "Not provided"} />
              <ProfileItem icon={<IndianRupee />} label="Annual Income" value={profile.income !== null ? `₹${profile.income.toLocaleString()}` : "Not provided"} />
              <ProfileItem icon={<Activity />} label="Disability" value={profile.disability !== null ? (profile.disability ? "Yes" : "No") : "Not provided"} />
              <ProfileItem icon={<ShieldCheck />} label="Land Owned" value={profile.land_owned !== null ? (profile.land_owned ? "Yes" : "No") : "Not provided"} />
            </div>

            <div className="bg-[#EEF3FF] px-8 py-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <p className="text-sm text-[#0B3CC8] font-medium">To add missing verified data, upload official documents.</p>
              <Link href="/documents">
                <button className="text-xs font-bold uppercase tracking-wider bg-white border border-[#0B3CC8] text-[#0B3CC8] px-4 py-2 rounded-sm hover:bg-[#0B3CC8] hover:text-white transition-colors">
                  Go to Wallet
                </button>
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function ProfileItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-sm bg-[#F1F5F9] text-[#64748B] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B] mb-1">{label}</p>
        <p className="font-semibold text-[#0F172A] text-base">{value}</p>
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfilePageInner />
    </Suspense>
  );
}
