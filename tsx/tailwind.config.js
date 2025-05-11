// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a", // Bleu foncé
        primary: "#38bdf8", // Bleu électrique
        secondary: "#a78bfa", // Violet
        accent: "#22d3ee", // Cyan
      },
    },
  },
  plugins: [],
};
