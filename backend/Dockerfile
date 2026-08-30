FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --build-from-source

COPY . .

CMD ["node", "index.js"]
