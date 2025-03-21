#!/bin/bash
set -e

GIT_SHA=$(git rev-parse HEAD)
GIT_TIMESTAMP=$(git log -1 --format=%cI)

docker build \
  --build-arg VITE_APP_GIT_SHA=$GIT_SHA \
  --build-arg VITE_APP_GIT_TIMESTAMP=$GIT_TIMESTAMP \
  -t connect-app:latest .

docker run -p 8080:80 connect-app:latest