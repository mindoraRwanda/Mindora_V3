# Mindora user-service — Node.js 24 (see .nvmrc)
# Build from repo root: docker build -f apps/user-service/Dockerfile .

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm install
RUN npm run build -w @mindora/user-service

FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/user-service/dist ./apps/user-service/dist
COPY --from=build /app/apps/user-service/package.json ./apps/user-service/package.json
COPY --from=build /app/packages ./packages

EXPOSE 3002
CMD ["node", "apps/user-service/dist/index.js"]
