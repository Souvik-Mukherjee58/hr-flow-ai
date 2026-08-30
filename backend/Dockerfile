FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ sqlite

# Force clean npm cache to avoid cached native modules
RUN npm cache clean --force

COPY backend/package*.json ./

# Remove any existing node_modules and install fresh
RUN rm -rf node_modules package-lock.json && \
    npm install --build-from-source --no-cache

COPY backend/ .

CMD ["node", "index.js"]
