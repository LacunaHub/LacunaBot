FROM node:22-alpine AS builder

# Build argument for GitHub Packages authentication
ARG GH_PKG_TOKEN
ENV GH_PKG_TOKEN=${GH_PKG_TOKEN}

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code and config files
COPY tsconfig.json ./
COPY clean.dist.js ./
COPY config.env.js ./
COPY src ./src
COPY assets ./assets
COPY build ./build

# Build TypeScript
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Build argument for GitHub Packages authentication
ARG GH_PKG_TOKEN
ENV GH_PKG_TOKEN=${GH_PKG_TOKEN}

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY .npmrc ./
COPY config.env.js ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Remove .npmrc to avoid leaking token in final image
RUN rm -f .npmrc

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/build ./build

# Create logs directory
RUN mkdir -p logs

# Set environment
ENV NODE_ENV=prod

# Expose API port
EXPOSE 5810

# Default command (can be overridden in docker-compose or docker run)
# Defaults to cluster-broker as it's the primary coordinator
CMD ["npm", "run", "start"]
