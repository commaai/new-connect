FROM node:20-alpine AS base

# Install Bun (check package.json for the specific version)
ARG BUN_VERSION=1.2.5
RUN npm install -g bun@$BUN_VERSION
WORKDIR /app


FROM base AS build

# Copy files needed for installation
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application
ADD . ./

# Build arguments for environment variables
ARG VITE_APP_GIT_SHA=unknown
ARG VITE_APP_GIT_TIMESTAMP=1970-01-01T00:00:00Z
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_RELEASE
ENV VITE_APP_GIT_SHA $VITE_APP_GIT_SHA
ENV VITE_APP_GIT_TIMESTAMP $VITE_APP_GIT_TIMESTAMP
ENV SENTRY_AUTH_TOKEN $SENTRY_AUTH_TOKEN
ENV SENTRY_RELEASE $SENTRY_RELEASE

# Build the application
RUN bun run build


FROM nginx:1.24

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built application from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80