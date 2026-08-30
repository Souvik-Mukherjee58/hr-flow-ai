FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY backend/package*.json ./

RUN npm install --build-from-source

COPY backend/ .

CMD ["node", "index.js"]
