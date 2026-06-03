/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // CSS 변수를 Tailwind 색상으로 매핑
        background: "var(--background)",
      },
      fontFamily: {
        sans: ["SUIT Variable"],
      },
      keyframes: {},
      animation: {},
    },
  },
  plugins: [],
};
