FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ sqlite

COPY backend/package*.json ./

# Force rebuild of native modules
RUN npm cache clean --force && \
    npm install --build-from-source --no-save

COPY backend/ .

CMD ["node", "index.js"]
