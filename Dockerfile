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
ARG NEXT_PUBLIC_API_URL=https://touchdown-882290629693.us-central1.run.app
ARG NEXT_PUBLIC_BASE_URL=https://touchdown-882290629693.us-central1.run.app
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
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

# Cloud Run assigns PORT automatically
EXPOSE 8080

# Start Express server (serves both API and static Next.js)
CMD ["node", "/app/dist/server/server.js"]