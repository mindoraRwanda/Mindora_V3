# Mindora appointment-service — Node.js 24 (see .nvmrc)
# Build from repo root: docker build -f apps/appointment-service/Dockerfile .

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY docs ./docs

RUN npm install
RUN npm run build -w @mindora/appointment-service

FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/appointment-service/dist ./apps/appointment-service/dist
COPY --from=build /app/apps/appointment-service/package.json ./apps/appointment-service/package.json
COPY --from=build /app/packages ./packages
COPY --from=build /app/docs/appointment-service.yaml ./docs/appointment-service.yaml

EXPOSE 3003
CMD ["node", "apps/appointment-service/dist/index.js"]
