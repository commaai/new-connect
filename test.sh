set -e

bun install --frozen-lockfile
bun tsc --noEmit
bun biome ci
bun playwright install
bun run test run
bun lines
bun bundle-size
