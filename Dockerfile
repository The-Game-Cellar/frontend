# syntax=docker/dockerfile:1.6

# Build stage: Vite produces a static bundle. VITE_* env vars are baked in at build
# time (not runtime), so they come through as build args. Override via
# `docker build --build-arg VITE_API_URL=https://api.example.com .` for production.
FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
# Both empty by default: without a DSN the SDK is a no-op, and the release is the commit
# sha, which tags the image but is not readable from inside it. CI sets both.
ARG VITE_SENTRY_DSN=""
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ARG SENTRY_RELEASE=""
ENV SENTRY_RELEASE=$SENTRY_RELEASE
# The source map upload token is a BuildKit secret: readable during this step, present in
# no layer. Without it the Sentry plugin stays off and the build emits no maps at all.
RUN --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || true)" npm run build

# Runtime stage: nginx serves the static bundle with SPA fallback (any unknown
# path returns index.html so React Router handles the route client-side).
FROM nginx:1.27-alpine AS runtime
COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
