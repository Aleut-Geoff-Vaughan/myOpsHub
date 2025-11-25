#!/usr/bin/env bash
# Restart helper for MyScheduling (backend + frontend build)
# Usage: ./restart.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_PROJECT="$ROOT_DIR/backend/src/MyScheduling.Api/MyScheduling.Api.csproj"
API_URL="http://localhost:5107"
LOG_FILE="/tmp/myscheduling-api.log"
PID_FILE="/tmp/myscheduling-api.pid"

stop_api() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && ps -p "$pid" >/dev/null 2>&1; then
      echo "Stopping API (pid: $pid)..."
      kill "$pid" || true
      sleep 1
    fi
    rm -f "$PID_FILE"
  fi

  # Fallback: kill any lingering project-specific dotnet run
  local running
  running="$(pgrep -f "dotnet run --project .*MyScheduling.Api.csproj" || true)"
  if [[ -n "$running" ]]; then
    echo "Stopping lingering API process(es): $running"
    echo "$running" | xargs -r kill
  fi
}

build_backend() {
  echo "Building backend..."
  dotnet build "$API_PROJECT"
}

build_frontend() {
  echo "Building frontend..."
  (cd "$ROOT_DIR/frontend" && npm run build)
}

start_api() {
  echo "Starting API on $API_URL ..."
  nohup dotnet run --project "$API_PROJECT" --urls "$API_URL" >"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
  echo "API started (pid: $(cat "$PID_FILE")). Logs: $LOG_FILE"
}

tail_logs() {
  echo "Last 20 log lines:"
  tail -n 20 "$LOG_FILE" || true
}

main() {
  stop_api
  build_backend
  build_frontend
  start_api
  tail_logs
}

main "$@"
