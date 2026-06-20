FROM node:22-alpine AS base
RUN apk add --no-cache python3 make g++
RUN corepack enable

FROM base AS builder
WORKDIR /app

# Copy manifest files
# separate layer for dependency caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/core/package.json ./apps/core/

RUN pnpm install --frozen-lockfile

# Copy source and config
COPY tsconfig.json tsconfig.base.json ./
COPY apps/core/tsconfig.json apps/core/tsdown.config.ts ./apps/core/
COPY apps/core/src ./apps/core/src

RUN pnpm -F @lacunabot/core run build
RUN pnpm -F @lacunabot/core deploy --prod --legacy /prod

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /prod/node_modules ./node_modules
COPY --from=builder /prod/package.json ./package.json
COPY --from=builder /app/apps/core/dist ./dist
COPY --from=builder /app/apps/core/assets ./assets
COPY buildinfo.json ./

RUN mkdir -p logs

ENV NODE_ENV=prod

EXPOSE 5810

CMD ["node", "dist/cluster-broker"]
