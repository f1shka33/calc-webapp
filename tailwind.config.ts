import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#070708",
          soft: "#0d0d10",
          panel: "rgba(255,255,255,0.04)",
        },
        accent: {
          DEFAULT: "#FF6A00",
          hot: "#FF2D55",
          glow: "#FFB85A",
        },
        border: {
          soft: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
        },
      },
      fontFamily: {
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(255,106,0,0.55)",
        glowSoft: "0 0 30px -12px rgba(255,106,0,0.35)",
        panel: "0 10px 40px -10px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "gradient-accent":
          "linear-gradient(135deg,#FF8A3D 0%,#FF6A00 45%,#FF2D55 100%)",
        "gradient-radial":
          "radial-gradient(circle at 30% 20%,rgba(255,106,0,0.18),transparent 55%),radial-gradient(circle at 80% 80%,rgba(255,45,85,0.15),transparent 60%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(255,106,0,0.45)" },
          "50%": { boxShadow: "0 0 28px 4px rgba(255,106,0,0.35)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        floaty: "floaty 4s ease-in-out infinite",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
