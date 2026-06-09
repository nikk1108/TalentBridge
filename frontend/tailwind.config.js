/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        recruiter: {
          bg: "#121212",
          card: "#1a1a1a",
          hover: "#222222",
          border: "#2e2e2e",
          borderLight: "#333333",
          text: "#e4e4e7",       // zinc-200
          textMuted: "#a1a1aa",  // zinc-400
          accentAmber: "#d97706", // amber-600
          accentEmerald: "#059669" // emerald-600
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
