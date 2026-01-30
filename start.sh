#!/bin/sh
set -e

cd /app

echo "Starting Express backend on port 3001..."
node /app/dist/server/server.js > /tmp/express.log 2>&1 &
EXPRESS_PID=$!
echo "Express PID: $EXPRESS_PID"

echo "Waiting 5 seconds for Express to start..."
sleep 5

echo "Checking if Express is listening on 3001..."
if netstat -tuln | grep -q ":3001 "; then
  echo "✓ Express is listening on port 3001"
else
  echo "✗ Express NOT listening on port 3001"
  echo "Express log:"
  cat /tmp/express.log
fi

echo "Starting Next.js on port 3000..."
cd /app/client
node server.js > /tmp/nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "Next.js PID: $NEXTJS_PID"

echo "Waiting 5 seconds for Next.js to start..."
sleep 5

echo "Checking if Next.js is listening on 3000..."
if netstat -tuln | grep -q ":3000 "; then
  echo "✓ Next.js is listening on port 3000"
else
  echo "✗ Next.js NOT listening on port 3000"
  echo "Next.js log:"
  cat /tmp/nextjs.log
fi

echo "Starting nginx..."
cd /app
nginx -g 'daemon off;'

# Cleanup on exit
trap "kill $EXPRESS_PID $NEXTJS_PID" EXIT

