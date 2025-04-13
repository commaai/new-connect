# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv;error=true

# *** build app ***
FROM oven/bun:1.2.9-alpine AS build
WORKDIR /app
ADD . ./
RUN bun install --frozen-lockfile

# env
ARG VITE_APP_GIT_SHA=unknown
ARG VITE_APP_GIT_TIMESTAMP=1970-01-01T00:00:00Z
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_RELEASE
ENV VITE_APP_GIT_SHA=$VITE_APP_GIT_SHA
ENV VITE_APP_GIT_TIMESTAMP=$VITE_APP_GIT_TIMESTAMP
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV SENTRY_RELEASE=$SENTRY_RELEASE

RUN bun run build

# *** final image ***
FROM nginx:1.24
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
