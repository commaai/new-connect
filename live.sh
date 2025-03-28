#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR

if [ ! -d "$HOME/.bun" ]; then
  curl -fsSL https://bun.sh/install | bash
fi

bun upgrade
bun install
bun run dev -- --open
