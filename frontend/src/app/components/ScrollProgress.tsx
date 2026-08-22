"use client";

import { motion, useScroll } from "framer-motion";

export default function ScrollProgress() {
    const { scrollYProgress } = useScroll();

    return (
        <motion.div
            id="scroll-indicator"
            style={{
                scaleX: scrollYProgress,
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: 8,
                originX: 0,
                backgroundColor: "#FF9933", // Orange for better contrast against blue
                zIndex: 9999,
            }}
        />
    );
}
