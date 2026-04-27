import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050507",
          900: "#0a0a0d",
          800: "#101015",
          700: "#16161d",
          600: "#1f1f29"
        },
        blood: {
          500: "#ff1a3c",
          600: "#e60026",
          700: "#b3001b",
          900: "#5a000d"
        },
        silver: {
          100: "#f4f4f6",
          200: "#d8d8de",
          300: "#a8a8b0",
          400: "#7a7a82"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "Bebas Neue", "sans-serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"]
      },
      boxShadow: {
        glow: "0 0 60px -10px rgba(255, 26, 60, 0.45)",
        "glow-lg": "0 0 120px -20px rgba(255, 26, 60, 0.55)",
        glass: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 30px 80px -40px rgba(255, 26, 60, 0.35)"
      },
      backgroundImage: {
        "radial-blood":
          "radial-gradient(ellipse at top, rgba(230,0,38,0.25) 0%, rgba(10,10,13,0) 60%)",
        "noise":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 0.05  0 0 0 0 0.12  0 0 0 0.18 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
      },
      animation: {
        "glow-pulse": "glowPulse 4s ease-in-out infinite",
        "scan": "scan 6s linear infinite",
        "drift": "drift 14s ease-in-out infinite",
        "glitch": "glitch 2.6s infinite steps(1)",
        "marquee": "marquee 40s linear infinite"
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" }
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" }
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-12px,0)" }
        },
        glitch: {
          "0%, 92%, 100%": { transform: "translate(0,0)", filter: "none" },
          "94%": { transform: "translate(-2px, 1px)", filter: "hue-rotate(-15deg)" },
          "96%": { transform: "translate(2px, -1px)", filter: "hue-rotate(15deg)" },
          "98%": { transform: "translate(-1px, 0)", filter: "none" }
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
