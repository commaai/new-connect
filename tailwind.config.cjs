const defaultTheme = require('tailwindcss/defaultTheme')

const { createThemes } = require('tw-colors')
const kebabcase = require('lodash.kebabcase')

const theme = require('./src/theme/theme.json')

const getSchemeColours = (scheme) => ({
  ...Object.fromEntries(
    Object.entries(theme.schemes[scheme]).map(([key, value]) => [
      kebabcase(key),
      value,
    ]),
  ),
  white: '#ffffff',
})

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.tsx', './index.html'],
  theme: {
    borderRadius: {
      none: '0',
      xs: '0.25em',
      sm: '0.5em',
      md: '0.75em',
      lg: '1em',
      xl: '1.75em',
      full: '9999px',
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      keyframes: {
        ripple: {
          '100%': {
            transform: 'scale(4)',
            opacity: 0,
          },
        },
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        indeterminate1: {
          '0%': {
            left: '-35%',
            right: '100%',
          },
          '60%': {
            left: '100%',
            right: '-90%',
          },
          '100%': {
            left: '100%',
            right: '-90%',
          },
        },
        indeterminate2: {
          '0%': {
            left: '-200%',
            right: '100%',
          },
          '60%': {
            left: '107%',
            right: '-8%',
          },
          '100%': {
            left: '107%',
            right: '-8%',
          },
        },
        'circular-rotate': {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
        'circular-dash': {
          '0%': {
            strokeDasharray: '1px, 200px',
            strokeDashoffset: 0,
          },
          '50%': {
            strokeDasharray: '100px, 200px',
            strokeDashoffset: -15,
          },
          '100%': {
            strokeDasharray: '100px, 200px',
            strokeDashoffset: -125,
          },
        },
      },
      animation: {
        ripple: 'ripple 600ms linear',
        indeterminate1:
          'indeterminate1 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite',
        indeterminate2:
          'indeterminate2 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite',
        'circular-rotate': 'circular-rotate 1.4s linear infinite',
        'circular-dash': 'circular-dash 1.4s ease-in-out infinite',
      },
      transitionProperty: {
        typography: 'color, font-size, font-weight',
        surface: 'background-color, border-color, color, box-shadow',
        indeterminate: 'transform, background-color',
        drawer: 'left, opacity, width',
      },
    },
  },
  plugins: [
    createThemes(({ light, dark }) => ({
      light: light(getSchemeColours('light')),
      dark: dark(getSchemeColours('dark')),
    })),
  ],
}
