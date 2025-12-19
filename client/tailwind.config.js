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
        // Neon theme color presets using CSS variables - using hex values directly
        'neon-cyan': '#00ffe7',
        'neon-pink': '#faafe8',
        'neon-pink-dark': '#ff005c',
        
        // Keep nested structure for prefixed usage
        neon: {
          cyan: '#00ffe7',
          pink: '#faafe8',
          'pink-dark': '#ff005c',
        },
        bg: {
          dark: '#181a23',
          darker: '#23263a',
          darkest: '#1a1d2e',
          card: '#16182a',
        },
        text: {
          light: '#e0e7ef',
          muted: '#b0b7bf',
          disabled: '#666666',
        },
        accent: {
          blue: '#b8eaff',
          teal: '#00b3a1',
        },
        purple: {
          light: '#a259ff',
          base: '#9945ff',
          dark: '#6019b5',
          'field-goal': '#9333EA',
        },
        green: {
          light: '#00ff88',
          base: '#00FF00',
          dark: '#00b35f',
        },
        blue: {
          light: '#4dabf7',
          dark: '#1a7fd1',
          kickoff: '#4169E1',
          punt: '#87CEEB',
        },
        red: {
          base: '#FF3333',
          dark: '#CC0000',
          darker: '#b30042',
        },
        orange: {
          base: '#FFA500',
          warning: '#FF8C00',
        },
        yellow: {
          gold: '#FFD700',
          bright: '#FFFF00',
        },
        pink: {
          darker: '#b30042',
        }
      },
      gradientColorStops: {
        'neon-gradient': {
          'from': 'var(--neon-cyan)',
          'to': 'var(--neon-pink)',
        }
      }
    },
  },
  plugins: [],
};
