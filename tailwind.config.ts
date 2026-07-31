import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // PlanR brand palette
        primary: "#E62429",
        background: "#0A0A0A",
        foreground: "#F5F5F0",
      },
    },
  },
  plugins: [],
};
export default config;
