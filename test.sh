set -e

bun install --frozen-lockfile
bun biome ci
bun playwright install
bun run test run
bun lines
