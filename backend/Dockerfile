# Multi-stage build for clean environment
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ sqlite

# Clean npm cache completely
RUN npm cache clean --force

COPY backend/package*.json ./

# Install dependencies with build from source
RUN npm install --build-from-source --no-cache

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY backend/ .

CMD ["node", "index.js"]
