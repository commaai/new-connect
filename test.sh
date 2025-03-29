set -e

bun install --frozen-lockfile
bun biome ci
bun tsc --noEmit
bun playwright install
bun run test run
bun lines
bun bundle-size
