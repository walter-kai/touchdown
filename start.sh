#!/bin/sh
set -e

echo "Starting Express backend on port 3001..."
node /app/dist/server/server.js &
EXPRESS_PID=$!

echo "Waiting for Express to start..."
sleep 2

echo "Starting Next.js on port 3000..."
cd /app/client
node server.js &
NEXTJS_PID=$!

echo "Waiting for Next.js to start..."
sleep 2

echo "Starting nginx..."
nginx -g 'daemon off;'

# Keep the script running
wait $EXPRESS_PID $NEXTJS_PID
