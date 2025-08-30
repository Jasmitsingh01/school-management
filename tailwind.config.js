/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#007BFF",
        secondary: "#6c757d",
        success: "#28a745",
        danger: "#dc3545",
        light: "#f8f9fa",
        dark: "#343a40",
      },
    },
  },
  plugins: [],
};