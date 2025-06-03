FROM node:22-slim AS base

FROM base AS builder

# RUN apk add --no-cache gcompat
WORKDIR /app

COPY ./ ./

RUN corepack enable pnpm && pnpm install && pnpm run build:node

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /app/dist-node /app/dist
COPY --from=builder --chown=hono:nodejs /app/public /app/public

USER hono
EXPOSE 3000

CMD ["node", "/app/dist/node.mjs"]
