
# Use Node.js Alpine image
FROM node:24-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose Catalog Service port
EXPOSE 8001

# Start the service
CMD ["npm", "start"]
