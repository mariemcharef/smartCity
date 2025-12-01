FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY alert.proto ./alert.proto
EXPOSE 3005
CMD ["node", "server.js"]
