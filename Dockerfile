# Use an official Node.js image as the base
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Set environment variable if needed (optional)
ENV NODE_ENV=production

# Build the TypeScript code
RUN npm run build

# Build only in production mode
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi

# Expose the port your app runs on (adjust as needed)
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
