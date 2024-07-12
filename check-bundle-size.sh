#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
cd $DIR

bun vite-bundle-visualizer -t list -o ./bundle.yaml

BUNDLE_SIZE=0
gzip_values=$(yq eval '.[][]["gzip"]' bundle.yaml)
for gzip_value in $gzip_values; do
    BUNDLE_SIZE=$((BUNDLE_SIZE + gzip_value / 1024))
done

echo "Bundle size is $BUNDLE_SIZE K"

if [ $BUNDLE_SIZE -gt 500 ]; then 
    echo "Exceeded bundle size limit!"
    exit 1
fi