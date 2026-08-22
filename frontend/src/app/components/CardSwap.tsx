"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CardSwapProps {
  children: ReactNode[];
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`w-full bg-[#0F203C] border border-white/10 rounded-2xl p-6 shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

export default function CardSwap({
  children,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
}: CardSwapProps) {
  const [cards, setCards] = useState<ReactNode[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (children && Array.isArray(children)) {
      // Assign keys to children if they don't have them to ensure stable Framer Motion layout
      const keyedChildren = children.map((child, i) => 
        React.isValidElement(child) ? React.cloneElement(child, { key: child.key || `card-${i}` }) : child
      );
      setCards(keyedChildren);
    } else if (children) {
      setCards([children]);
    }
  }, [children]);

  useEffect(() => {
    if (cards.length <= 1) return;
    if (pauseOnHover && isHovered) return;

    const interval = setInterval(() => {
      setCards((prev) => {
        const newCards = [...prev];
        const first = newCards.shift();
        if (first) newCards.push(first);
        return newCards;
      });
    }, delay);

    return () => clearInterval(interval);
  }, [cards.length, delay, isHovered, pauseOnHover]);

  if (cards.length === 0) return null;

  return (
    <div
      className="relative w-full h-full flex justify-center items-start"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {cards.map((child, index) => {
          const zIndex = cards.length - index;
          // Invert the yOffset so cards stack upwards and slide down to the front
          const yOffset = -(index * verticalDistance);
          const scale = 1 - index * 0.05;
          const opacity = 1 - index * 0.2;
          
          return (
            <motion.div
              // @ts-ignore
              key={child.key}
              layout
              className="absolute w-full max-w-sm origin-top"
              initial={{ opacity: 0, y: -40, scale: 0.9 }}
              animate={{
                y: yOffset,
                scale: scale,
                zIndex: zIndex,
                opacity: opacity,
              }}
              exit={{ opacity: 1, y: 150, scale: 0.9, filter: "blur(2px)" }}
              transition={{
                type: "tween",
                ease: [0.25, 0.1, 0.25, 1], // Smooth easeInOut curve
                duration: 0.65
              }}
            >
              {child}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
