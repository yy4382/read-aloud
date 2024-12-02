FROM node:22-alpine AS base

FROM base AS builder

RUN apk add --no-cache gcompat
WORKDIR /app

COPY package.json pnpm*.yaml ./
COPY packages/cf-worker ./packages/cf-worker

RUN cd packages/cf-worker && corepack enable pnpm && pnpm install && pnpm run build:node

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /app/packages/cf-worker/dist-node /app/dist

USER hono
EXPOSE 3000

CMD ["node", "/app/dist/node.mjs"]
