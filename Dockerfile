FROM node:slim

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy server code
COPY . .

# Expose server port
EXPOSE 80

CMD ["node", "index.js"]
