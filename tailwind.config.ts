import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8F0",
        amber: {
          accent: "#E8913A",
        },
        coral: {
          accent: "#E8705A",
        },
        cn: {
          red: "#E54D42",
          green: "#2EA169",
        },
        card: "#FFFFFF",
        muted: "#8C8C8C",
        heading: "#2D2D2D",
        body: "#4A4A4A",
      },
      fontFamily: {
        sans: [
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
