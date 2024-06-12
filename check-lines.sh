#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
cd $DIR

COUNT="$(find src/ -type f | xargs wc -l | tail -n 1 | awk '{print $1}')"
echo "$COUNT total lines"

if [ "$COUNT" -gt 5000 ]; then
  echo "Exceeded line limit!"
  exit 1
fi
