FROM node:20-slim

WORKDIR /app

# Copy package configurations and install node modules
COPY package.json package-lock.json* ./
RUN npm install

# Copy application files
COPY . .

EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev"]
