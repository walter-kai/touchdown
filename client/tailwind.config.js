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
        // Neon theme color presets using CSS variables
        neon: {
          cyan: 'var(--neon-cyan)',
          pink: 'var(--neon-pink)',
          'pink-dark': 'var(--neon-pink-dark)',
          dark: 'var(--bg-dark)',
          darker: 'var(--bg-darker)',
          light: 'var(--text-light)',
          accent: 'var(--accent-blue)',
        },
        bg: {
          dark: 'var(--bg-dark)',
          darker: 'var(--bg-darker)',
          darkest: 'var(--bg-darkest)',
          card: 'var(--bg-card)',
        },
        text: {
          light: 'var(--text-light)',
          muted: 'var(--text-muted)',
          disabled: 'var(--text-disabled)',
        },
        accent: {
          blue: 'var(--accent-blue)',
          teal: 'var(--accent-teal)',
        },
        purple: {
          light: 'var(--purple-light)',
          base: 'var(--purple-base)',
          dark: 'var(--purple-dark)',
          'field-goal': 'var(--purple-field-goal)',
        },
        green: {
          light: 'var(--green-light)',
          base: 'var(--green-base)',
          dark: 'var(--green-dark)',
        },
        blue: {
          light: 'var(--blue-light)',
          dark: 'var(--blue-dark)',
          kickoff: 'var(--blue-kickoff)',
          punt: 'var(--blue-punt)',
        },
        red: {
          base: 'var(--red-base)',
          dark: 'var(--red-dark)',
          darker: 'var(--red-darker)',
        },
        orange: {
          base: 'var(--orange-base)',
          warning: 'var(--orange-warning)',
        },
        yellow: {
          gold: 'var(--yellow-gold)',
          bright: 'var(--yellow-bright)',
        },
        pink: {
          darker: 'var(--pink-darker)',
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
