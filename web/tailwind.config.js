/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: "#07090e",
          900: "#0b0e17",
          850: "#101524",
          800: "#171e33",
          700: "#222c4a",
        },
        neon: {
          cyan: "#00f0ff",
          purple: "#9d4edd",
          emerald: "#10b981",
          amber: "#f59e0b",
        }
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
