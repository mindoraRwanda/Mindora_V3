# Mindora docs-gateway — Node.js 24 (see .nvmrc)
# Build from repo root: docker build -f apps/docs-gateway/Dockerfile .
#
# Simpler than the other service images: no Prisma client to regenerate, since
# this service only aggregates the other services' OpenAPI specs.

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm install
RUN npx turbo run build --filter=@mindora/docs-gateway

FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/docs-gateway/dist ./apps/docs-gateway/dist
COPY --from=build /app/apps/docs-gateway/package.json ./apps/docs-gateway/package.json
COPY --from=build /app/packages ./packages

EXPOSE 3010
CMD ["node", "apps/docs-gateway/dist/index.js"]
