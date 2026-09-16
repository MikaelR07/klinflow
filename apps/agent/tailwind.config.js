/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ['"Space Grotesk"', 'sans-serif'],
    },
    extend: {
      colors: {
        primary: "#2b9e31",
        secondary: "#3B82F6",
        slate: {
          50: "#ffffff",    /* Was #F3F4F6 (Whitish), now Pure White for page backgrounds */
          400: "#9CA3AF",   /* Muted Text */
          500: "#9CA3AF",   /* Muted Text */
          700: "#161D26",   /* Borders */
          800: "#161D26",   /* Cards */
          900: "#0B0F14",   /* Background */
          950: "#0B0F14",   /* Deep Background */
        },
        white: "#F8F8FF",   /* Was pure white, now Whitish override for cards in light mode */
      },
    },
  },
  plugins: [],
}
