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
        paper: "#f4f5f5",
        line: "#d9dddd",
        muted: "#666666",
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
