FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy all files
COPY . .

# Build Next.js app
RUN npm run build

# Start the application
CMD ["npm", "run", "start"]
