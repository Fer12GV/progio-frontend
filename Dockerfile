# syntax=docker/dockerfile:1
# PROGIO Frontend — production image: Vite build → Nginx Alpine

FROM node:20-alpine AS build

WORKDIR /app

# Build-time only (embedded in the bundle). Override via docker compose `build.args`.
ARG VITE_API_BASE_URL=http://localhost:9001
ARG VITE_API_PREFIX=/api/v1

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_PREFIX=${VITE_API_PREFIX}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
