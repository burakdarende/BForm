FROM node:18-alpine

# Install build dependencies for sharp
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libgsf-dev vips-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "dev"]
