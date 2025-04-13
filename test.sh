set -e

bun install --frozen-lockfile
bun biome ci
bun tsc
[ -z "$SKIP_PLAYWRIGHT_INSTALL" ] && bun playwright install
bun run test run
bun lines
bun bundle-size
