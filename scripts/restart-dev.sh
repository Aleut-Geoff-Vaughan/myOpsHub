#!/usr/bin/env bash

set -uo pipefail

# Configuration
BACKEND_PORT=${BACKEND_PORT:-5107}
FRONTEND_PORT=${FRONTEND_PORT:-5173}
BACKEND_LOG=${BACKEND_LOG:-/tmp/myscheduling-backend.log}
FRONTEND_LOG=${FRONTEND_LOG:-/tmp/myscheduling-frontend.log}

echo "🔄 Restarting myScheduling dev servers..."

echo "⏹ Stopping existing backend/frontend (if any)..."
pkill -f "dotnet .*MyScheduling.Api" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || pkill -f "npm run dev" 2>/dev/null || true

echo "🚀 Starting backend on http://localhost:${BACKEND_PORT} ..."
cd /workspaces/myScheduling/backend/src/MyScheduling.Api
ASPNETCORE_URLS="http://localhost:${BACKEND_PORT}" dotnet run > "${BACKEND_LOG}" 2>&1 &
BACK_PID=$!
echo "   Backend PID: ${BACK_PID} (logs: ${BACKEND_LOG})"

echo "🚀 Starting frontend on http://localhost:${FRONTEND_PORT} ..."
cd /workspaces/myScheduling/frontend
VITE_API_PROXY_TARGET="http://localhost:${BACKEND_PORT}" npm run dev > "${FRONTEND_LOG}" 2>&1 &
FRONT_PID=$!
echo "   Frontend PID: ${FRONT_PID} (logs: ${FRONTEND_LOG})"

sleep 2
echo "🔍 Listening ports:"
command -v lsof >/dev/null && lsof -i :"${BACKEND_PORT}" -i :"${FRONTEND_PORT}" || true

echo "✅ Done. Check logs if anything looks off."
