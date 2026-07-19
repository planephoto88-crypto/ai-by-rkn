# ============================================
# AI Productivity Agent — Dockerfile
# Node.js 20 + Express backend + Static frontend
# ============================================
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install --production

# Copy all application files
COPY . .

# Expose the port Render assigns
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]
