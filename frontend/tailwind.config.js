/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '976px',
      xl: '1440px',
    },
    fontFamily: {
      code: ['Source Code Pro', 'serif'],
      main: ['Barlow', 'sans-serif'],
      doto: ['Doto', 'sans-serif']
    },
    extend: {
      spacing: {
        '128': '32rem',
        '144': '36rem',
        '20v': '20vh',
        "20h": "20vw",
        "95h": "95vw",
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  },
  plugins: [],
}
