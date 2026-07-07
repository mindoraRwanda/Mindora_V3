# Mindora mood-tracking-service — Node.js 24 (see .nvmrc)
# Build from repo root: docker build -f apps/mood-tracking-service/Dockerfile .

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY docs ./docs

RUN npm install
RUN npm run build -w @mindora/mood-tracking-service

FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/mood-tracking-service/dist ./apps/mood-tracking-service/dist
COPY --from=build /app/apps/mood-tracking-service/package.json ./apps/mood-tracking-service/package.json
COPY --from=build /app/packages ./packages
COPY --from=build /app/docs/mood-service.yaml ./docs/mood-service.yaml

EXPOSE 3004
CMD ["node", "apps/mood-tracking-service/dist/index.js"]
