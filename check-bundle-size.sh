#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
cd $DIR

BUNDLE_SIZE=$(find dist -type f ! -name "*.map" -exec sh -c 'gzip -9c "{}" | wc -c' \; | awk '{total += $1} END {print int(total/1024)}')
echo "Bundle size is ${BUNDLE_SIZE}KiB"

if [ $BUNDLE_SIZE -lt 200 ]; then
  echo "Bundle sizer lower than expected, let's lower the limit!"
  exit 1
fi

if [ $BUNDLE_SIZE -gt 235 ]; then
  echo "Exceeded bundle size limit!"
  exit 1
fi
