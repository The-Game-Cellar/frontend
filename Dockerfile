# syntax=docker/dockerfile:1.6

# Build stage: Vite produces a static bundle. VITE_* env vars are baked in at build
# time (not runtime), so they come through as build args. Override via
# `docker build --build-arg VITE_API_URL=https://api.example.com .` for production.
FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
# `npm install` rather than `npm ci` so the build tolerates a lockfile generated
# on a different OS where optional native deps (e.g. @emnapi/*) differ. Switch
# to `npm ci` once the lockfile is regenerated under Linux.
RUN npm install --no-audit --no-fund
COPY . .
ARG VITE_API_URL=http://localhost:8000
ARG VITE_KEYCLOAK_URL=http://localhost:8080
ARG VITE_KEYCLOAK_REALM=game-cellar
ARG VITE_KEYCLOAK_CLIENT_ID=game-cellar-client
ENV VITE_API_URL=$VITE_API_URL \
    VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL \
    VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID
RUN npm run build

# Runtime stage: nginx serves the static bundle with SPA fallback (any unknown
# path returns index.html so React Router handles the route client-side).
FROM nginx:1.27-alpine AS runtime
COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
