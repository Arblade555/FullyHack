import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep-sea palette: midnight-blue gradient meant to evoke descending depth.
        abyss: {
          50: "#eef4fb",
          100: "#d6e3f0",
          200: "#aec7e0",
          300: "#7ea5cb",
          400: "#4c7fb0",
          500: "#2f5c8f",
          600: "#204472",
          700: "#163258",
          800: "#0f2340",
          900: "#07172b",
          950: "#030b18",
        },
        // Warm accent that pops against dark blues — used for conflict / decay flags.
        // 100/200/300 shades added for readable text on dark surfaces.
        kelp: {
          100: "#fdecc3",
          200: "#fbe19a",
          300: "#f8cd71",
          400: "#f5b544",
          500: "#e89627",
          600: "#c97914",
        },
        coral: {
          100: "#fcd7d1",
          200: "#f9b8b0",
          300: "#f5978b",
          400: "#f17a6b",
          500: "#d95548",
          600: "#b73a2f",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
