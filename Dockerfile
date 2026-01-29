# Stage 0: Build the Next.js client
FROM node:20-alpine AS client-build

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy types first (shared dependency)
COPY ./types ./types

# Copy client dependencies and install
COPY ./client/package*.json ./client/
RUN cd client && npm install

# Copy client source code
COPY ./client ./client

# Build the Next.js app (creates .next folder and standalone output)
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
RUN npm install --include=dev

# Copy server source code
COPY ./server ./server

# Build server TypeScript
RUN npm run build

# Stage 2: Final production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install netcat for health checks
RUN apk add --no-cache netcat-openbsd

# Copy Next.js standalone build
COPY --from=client-build /app/client/.next/standalone ./client
COPY --from=client-build /app/client/.next/static ./client/.next/static
COPY --from=client-build /app/client/public ./client/public

# Copy server build files and shared types
COPY --from=server-build /app/dist ./dist
COPY --from=server-build /app/types ./types

# Copy server production dependencies
COPY ./package*.json ./
RUN npm install --only=production

# Set environment variables for production
ENV NODE_ENV=production
ENV BACKEND_PORT=3001
ENV PORT=3000

# Expose ports for Next.js and backend server
EXPOSE 3000 3001

# Start both backend server and Next.js
CMD ["sh", "-c", "npm run start & echo 'Waiting for backend on port 3001...' && while ! nc -z 127.0.0.1 3001; do sleep 1; done && echo 'Backend ready, starting Next.js...' && cd client && node server.js"]