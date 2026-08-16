import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: "#FF9933",
          50: "#FFF6EC",
          100: "#FFEAD4",
          600: "#DB7A14",
          700: "#B25F0C",
        },
        indiagreen: {
          DEFAULT: "#138808",
          50: "#F0FAEE",
          100: "#DCF3D8",
          600: "#117507",
          700: "#0E6206",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
      },
      keyframes: {
        "question-in": {
          "0%": { opacity: "0", transform: "translateX(28px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "question-in": "question-in 0.35s ease-out both",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
