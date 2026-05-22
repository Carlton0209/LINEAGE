import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D1117",
        foreground: "#F6F8FA",
        muted: "#8B949E",
        panel: "#161B22",
        border: "#30363D",
        cream: "#EFEFEF",
        "cream-soft": "#F5F5F5",
        ink: "#111111",
        "ink-muted": "#5C5C5C",
        "ink-rule": "#E2E2E2",
        accent: "#E97451",
        accentMuted: "#3A211C",
        accentDeep: "#B85042"
      },
      fontFamily: {
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["Aptos Display", "Calibri", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        line: "0 0 0 1px rgba(48, 54, 61, 0.9)"
      }
    }
  },
  plugins: []
};

export default config;
