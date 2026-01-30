#!/bin/sh
set -e

cd /app

echo "Starting Express backend on port 3001..."
node /app/dist/server/server.js > /tmp/express.log 2>&1 &
EXPRESS_PID=$!
echo "Express PID: $EXPRESS_PID"

echo "Waiting 3 seconds for Express to start..."
sleep 3

echo "Starting Next.js on port 3000..."
cd /app/client
node server.js > /tmp/nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "Next.js PID: $NEXTJS_PID"

echo "Waiting 3 seconds for Next.js to start..."
sleep 3

echo "Starting nginx..."
cd /app
nginx -g 'daemon off;'

# Cleanup on exit
trap "kill $EXPRESS_PID $NEXTJS_PID" EXIT

