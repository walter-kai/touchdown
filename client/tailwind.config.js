/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        lato: ['Lato'],
        savate: ['Savate'],
        marck: ['Marck Script'],
      },
      colors: {
        // Neon theme color presets
        neon: {
          cyan: '#00ffe7',      // Primary neon cyan
          pink: '#ff005c',      // Secondary neon pink
          purple: '#faafe8',    // Light purple/pink
          dark: '#181a23',      // Dark background
          darker: '#23263a',    // Slightly lighter dark
          light: '#e0e7ef',     // Light text
          accent: '#b8eaff',    // Light blue accent
        }
      },
      gradientColorStops: {
        'neon-gradient': {
          'from': '#00ffe7',
          'to': '#faafe8',
        }
      },
      animation: {
        'ticker': 'ticker 60s linear infinite',
      },
      keyframes: {
        'ticker': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
};
