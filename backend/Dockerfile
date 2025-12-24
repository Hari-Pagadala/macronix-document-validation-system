FROM node:18-bullseye-slim

# Create app directory
WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --only=production

# Copy source code
COPY . .

# Expose API port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
