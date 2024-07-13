# package.json comments

## devDependencies

- @solidjs/testing-library: test solid components (only used for App.jsx component)
- @stylistic/eslint-plugin: enforce stylistic rules beyond standard ESLint
- @testing-library/jest-dom: testing lib (we don't use)
- @testing-library/user-event: testing lib (we don't use)
- @types/eslint__js: types for linting engine
- @types/mapbox__polyline: types for mapbox elements
- @typescript-eslint/eslint-plugin: ESLint rules for TS
- @typescript-eslint/parser: allows ESLint to parse TS
- autoprefixer: adds css vendor prefixes automatically
- eslint: linting engine
- eslint-plugin-solid: ESLint rules specific to solid
- eslint-plugin-tailwindcss: ESLint rules specific to tailwind
- globals: defines global identifiers for ESLint
- husky: git hooks tool, used here for pre-commit linting
- jsdom: js implementation of the dom (used in testing env which we don't really make use of)
- playwright: take screenshots to post on PRs
- postcss: transforms css with js; autoprefixer and tailwind get plugged into this
- solid-devtools: visualize reactivity graph (consider if necessary)
- tailwindcss: css framework
- typescript: js with types
- typescript-eslint: lets ESLint support TS
- vite: builds and serves app
- vite-plugin-solid: allows vite to properly compile solid components
- vitest: testing framework compatible with vite (only used for App.jsx component)
- wrangler: used for deploying assets to cloudflare

## dependencies

- @mapbox/polyline: display series of map coordinates as a line
- @solidjs/router: changes view based on browser url
- clsx: construct className strings conditionally
- dayjs: work with dates (e.g., parse, validate, etc.)
- hls.js: stream video data
- solid-js: JS ui framework
