#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
cd $DIR

gzip -r -9 dist
BUNDLE_SIZE=$(du -sk dist | cut -f1)
echo "Bundle size is $BUNDLE_SIZE K"

if [ $BUNDLE_SIZE -lt 200 ]; then
  echo "Bundle sizer lower than expected, let's lower the limit!"
  exit 1
fi

if [ $BUNDLE_SIZE -gt 500 ]; then
  echo "Exceeded bundle size limit!"
  exit 1
fi
