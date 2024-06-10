const defaultTheme = require('tailwindcss/defaultTheme')

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
      colors: [
        'background',
        'on-background',
        'surface',
        'surface-dim',
        'surface-bright',
        'surface-container-lowest',
        'surface-container-low',
        'surface-container',
        'surface-container-high',
        'surface-container-highest',
        'on-surface',
        'surface-variant',
        'on-surface-variant',
        'inverse-surface',
        'inverse-surface-variant',
        'outline',
        'outline-variant',
        'shadow',
        'scrim',
        'surface-tint',
        'primary',
        'on-primary',
        'primary-container',
        'on-primary-container',
        'inverse-primary',
        'secondary',
        'on-secondary',
        'secondary-container',
        'on-secondary-container',
        'tertiary',
        'on-tertiary',
        'tertiary-container',
        'on-tertiary-container',
        'error',
        'on-error',
        'error-container',
        'on-error-container',
      ].reduce((acc, color) => {
        acc[color] = `var(--md-sys-color-${color})`
        return acc
      }, {}),
      fontFamily: {
        // TODO: align with index.css
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      keyframes: {
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
}
