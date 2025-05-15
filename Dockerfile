# Use a minimal Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy only package files first to install dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the rest of the app
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]
