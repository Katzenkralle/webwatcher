/** @type {import('tailwindcss').Config} */
module.exports = {
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
    colors: {
      'base': '#303446',
      'panel': '#292C3C',
      'panel-deep': '#232634',
      'panel-sub': '#737994',
      'text': "#c6d0f5",
      "text-sub": "#a5adce",
      "text-dark": "#232634",
      "text-dark-sub": "#414559",
      "warning": "#ef9f76",
      "success": "#a6d189",
      "error": "#e78284",
      "info": "#8caaee"
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
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  },
  plugins: [],
}
