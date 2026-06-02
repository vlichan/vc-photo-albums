import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        paper: "#f7f5f0",
        line: "#e7e2d8",
        muted: "#706b64",
        moss: "#4e5c48"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 55px rgba(17, 17, 17, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
