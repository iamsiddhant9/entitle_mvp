"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";

export default function ScrollStack({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-col gap-8 w-full pb-10">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { index, total: React.Children.count(children) } as any);
        }
        return child;
      })}
    </div>
  );
}

export function ScrollStackItem({ children, index = 0, total = 1 }: { children: ReactNode; index?: number; total?: number }) {
  // Sticky top offset (base 100px + 24px per subsequent card)
  const topOffset = 100 + (index * 24); 
  
  // Calculate a z-index so the later cards appear on top
  const zIndex = 10 + index;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px" }}
      transition={{ duration: 0.4 }}
      className="sticky w-full bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-md"
      style={{ 
        top: `${topOffset}px`, 
        zIndex,
      }}
    >
      <div className="p-6 md:p-8">
        {children}
      </div>
    </motion.div>
  );
}
