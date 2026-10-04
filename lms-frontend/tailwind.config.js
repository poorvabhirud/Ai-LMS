/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12201D",         // near-black, cool teal undertone
        paper: "#F5F8F7",       // cool off-white (not cream)
        moss: "#0E6E63",        // deep pine teal - primary/brand
        mossdark: "#0A5049",    // teal hover/pressed
        signal: "#8C7FE0",      // lilac - secondary accent (AI features, highlights, ratings)
        line: "#DCE3E0",        // cool hairline borders
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};