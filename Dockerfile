# Stage 0: Build the client (React app)
FROM node:20-alpine AS client-build

WORKDIR /app

# Install Python and build tools needed for native modules
RUN apk add --no-cache python3 make g++

# Copy types first (shared dependency)
COPY ./types ./types

# Copy client dependencies and install
COPY ./client/package*.json ./client/
RUN cd client && npm install --legacy-peer-deps

# Copy client source code
COPY ./client ./client

# Pass environment variables for the client build
# Set the specific hostname for the production environment
ARG VITE_SERVER_HOSTNAME
ENV VITE_SERVER_HOSTNAME=${VITE_SERVER_HOSTNAME:-https://dexter-city-128290252214.us-central1.run.app}

# Build the React app
RUN cd client && npm run build

# Stage 1: Build the server (Node/Express with TypeScript)
FROM node:20.8.0-alpine3.18 AS server-build

WORKDIR /app

# Install Python and build tools needed for native modules
RUN apk add --no-cache python3 make g++

# Copy types first (shared dependency)
COPY ./types ./types

# Copy root dependencies and install
COPY ./package*.json ./
COPY ./tsconfig.json ./tsconfig.json
RUN npm install --include=dev --legacy-peer-deps

# Copy server source code
COPY ./server ./server

# Build server TypeScript
RUN npm run build

# Stage 2: Final stage with Nginx
FROM nginx:stable-alpine

WORKDIR /app

# Copy React build files to Nginx HTML directory
COPY --from=client-build /app/client/dist /usr/share/nginx/html

# Copy server build files and shared types
COPY --from=server-build /app/dist ./dist
COPY --from=server-build /app/types ./types

# Copy Nginx configuration
COPY ./nginx.conf /etc/nginx/nginx.conf

# Install production dependencies for the server and netcat for health checks
COPY ./package*.json ./
RUN apk add --no-cache nodejs npm netcat-openbsd && npm install --only=production

# Set environment variables for production
ENV BACKEND_PORT=3001
ENV NODE_ENV=production

# Expose ports for Nginx and backend server
EXPOSE 3001 443

# Start backend server and wait for it to be ready before starting nginx
CMD ["sh", "-c", "npm run start & echo 'Waiting for backend on port 3001...' && while ! nc -z 127.0.0.1 3001; do sleep 1; done && echo 'Backend ready, starting nginx...' && nginx -g 'daemon off;'"]