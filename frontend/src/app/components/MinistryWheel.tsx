"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const ministries = [
  { name: "Ministry of Agriculture", short: "MoA", gradient: "from-blue-950 to-[#0F203C]", shadow: "shadow-blue-900/50" },
  { name: "Ministry of Health", short: "MoHFW", gradient: "from-blue-950 to-[#0F203C]", shadow: "shadow-blue-900/50" },
  { name: "Ministry of Education", short: "MoE", gradient: "from-blue-950 to-[#0F203C]", shadow: "shadow-blue-900/50" },
  { name: "Ministry of Rural Dev.", short: "MoRD", gradient: "from-blue-950 to-[#0F203C]", shadow: "shadow-blue-900/50" },
  { name: "Ministry of Labor", short: "MoLE", gradient: "from-blue-950 to-[#0F203C]", shadow: "shadow-blue-900/50" },
  { name: "Ministry of Finance", short: "MoF", gradient: "from-blue-950 to-[#0F203C]", shadow: "shadow-blue-900/50" },
  { name: "Ministry of Women", short: "MWCD", gradient: "from-blue-950 to-[#0F203C]", shadow: "shadow-blue-900/50" },
  { name: "Social Justice", short: "MoSJE", gradient: "from-blue-950 to-[#0F203C]", shadow: "shadow-blue-900/50" },
];

export default function MinistryWheel() {
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrame: number;
    let rotation = 0;

    const animate = () => {
      rotation += 0.15; // Smooth, slow rotation
      if (rotation >= 360) rotation -= 360;
      
      if (wheelRef.current) {
        wheelRef.current.style.setProperty('--wheel-rot', `${rotation}deg`);
      }
      
      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const radius = 280; // Radius of the main orbit

  return (
    <div className="relative w-full overflow-hidden flex justify-center pb-8 pt-24 bg-[#F3F4F6]" style={{ height: '400px' }}>
      
      {/* Dynamic Ambient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-cyan-400/20 rounded-full blur-[60px] pointer-events-none z-0" />

      {/* Concentric Orbit Rings */}
      <div className="absolute bottom-0 z-0">
        {/* Outer subtle ring */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full border border-gray-300/40"
          style={{ width: radius * 2 + 100, height: radius * 2 + 100, marginBottom: -(radius + 50) }}
        />
        {/* Main dashed orbit */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full border-2 border-dashed border-blue-300/60"
          style={{ width: radius * 2, height: radius * 2, marginBottom: -radius }}
        />
        {/* Inner subtle ring */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full border border-gray-300/40"
          style={{ width: radius * 2 - 100, height: radius * 2 - 100, marginBottom: -(radius - 50) }}
        />
      </div>

      {/* Rotating Items Container */}
      <div 
        ref={wheelRef}
        className="absolute bottom-0 z-10"
        style={{
          width: 0,
          height: 0,
        }}
      >
        {ministries.map((ministry, i) => {
          const angle = (i / ministries.length) * 360;

          return (
            <div
              key={ministry.name}
              className="absolute top-1/2 left-1/2 -ml-[50px] -mt-[50px] w-[100px] h-[100px] flex flex-col items-center justify-center group"
              style={{
                transform: `rotate(calc(${angle}deg + var(--wheel-rot, 0deg))) translateY(${-radius}px) rotate(calc(${-angle}deg - var(--wheel-rot, 0deg)))`,
              }}
            >
              {/* Rich Gradient Logo Bubble */}
              <div className={`w-[70px] h-[70px] rounded-full flex items-center justify-center shadow-lg shadow-blue-900/10 bg-gradient-to-br ${ministry.gradient} transition-all duration-500 ease-out group-hover:scale-[1.3] group-hover:-translate-y-2 group-hover:shadow-2xl ${ministry.shadow} relative overflow-hidden p-3.5 border-2 border-white/30 z-20`}>
                <div className="w-full h-full relative">
                  <Image
                    src="/ashoka.svg"
                    alt="Ashoka Stambh"
                    fill
                    className="object-contain brightness-0 invert drop-shadow-md"
                  />
                </div>
              </div>
              
              {/* Premium Glassmorphic Ministry Tag */}
              <div className="mt-3 text-[10.5px] font-extrabold text-center leading-tight text-[#0F172A] bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-white/80 whitespace-nowrap transition-all duration-500 group-hover:opacity-100 group-hover:-translate-y-1">
                {ministry.short}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Central Premium Hub */}
      <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 bg-white/70 backdrop-blur-xl px-12 py-6 rounded-t-[40px] border-t border-x border-white/80 shadow-[0_-15px_40px_rgba(11,60,200,0.06)] flex flex-col items-center z-30 w-[280px]">
        <div className="w-10 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full mb-4"></div>
        <h3 className="text-[11px] font-black text-[#0F172A] tracking-[0.2em] uppercase text-center bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500">
          Supported By
        </h3>
        <h4 className="text-[12px] font-bold text-[#0F172A] mt-1 text-center leading-tight">
          Central & State<br/>Ministries
        </h4>
      </div>
    </div>
  );
}
