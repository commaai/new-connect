FROM oven/bun:1.2.5-alpine AS build
WORKDIR /app

# Copy app
ADD . ./

# Install dependencies
RUN bun install --frozen-lockfile

# Build arguments for environment variables
ARG VITE_APP_GIT_SHA=unknown
ARG VITE_APP_GIT_TIMESTAMP=1970-01-01T00:00:00Z
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_RELEASE
ENV VITE_APP_GIT_SHA $VITE_APP_GIT_SHA
ENV VITE_APP_GIT_TIMESTAMP $VITE_APP_GIT_TIMESTAMP
ENV SENTRY_AUTH_TOKEN $SENTRY_AUTH_TOKEN
ENV SENTRY_RELEASE $SENTRY_RELEASE

# Build
RUN bun run build

FROM nginx:1.24

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built application from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80