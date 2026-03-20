import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        doggy: {
          gold: "#FFD700",
          orange: "#FFA500",
          dark: "#050d1f",
          card: "#0a1628",
        },
      },
    },
  },
  plugins: [],
};
export default config;
