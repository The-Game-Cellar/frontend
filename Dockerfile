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
RUN npm run build

# Runtime stage: nginx serves the static bundle with SPA fallback (any unknown
# path returns index.html so React Router handles the route client-side).
FROM nginx:1.27-alpine AS runtime
COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
