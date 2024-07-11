#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
cd $DIR

BUNDLE_SIZE=$(du -sk dist | cut -f1)
echo "Bundle size is $BUNDLE_SIZE K"

if [ $BUNDLE_SIZE -gt 1000 ]; then 
    echo "Exceeded bundle size limit!"
    exit 1
fi