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

  # Kill any dotnet processes running MyScheduling
  local dotnet_pids
  dotnet_pids="$(pgrep -f "MyScheduling" || true)"
  if [[ -n "$dotnet_pids" ]]; then
    echo "Stopping MyScheduling dotnet processes: $dotnet_pids"
    echo "$dotnet_pids" | xargs -r kill 2>/dev/null || true
  fi

  # Kill processes on port 5107 (backend)
  local port_5107
  port_5107="$(lsof -ti:5107 2>/dev/null || true)"
  if [[ -n "$port_5107" ]]; then
    echo "Stopping process on port 5107: $port_5107"
    echo "$port_5107" | xargs -r kill 2>/dev/null || true
  fi
}

stop_frontend() {
  echo "Stopping frontend dev servers..."

  # Kill Vite dev server processes
  local vite_pids
  vite_pids="$(pgrep -f "vite" || true)"
  if [[ -n "$vite_pids" ]]; then
    echo "Stopping Vite processes: $vite_pids"
    echo "$vite_pids" | xargs -r kill 2>/dev/null || true
  fi

  # Kill processes on port 5173 (Vite default)
  local port_5173
  port_5173="$(lsof -ti:5173 2>/dev/null || true)"
  if [[ -n "$port_5173" ]]; then
    echo "Stopping process on port 5173: $port_5173"
    echo "$port_5173" | xargs -r kill 2>/dev/null || true
  fi

  # Kill any node processes in the frontend directory
  local node_pids
  node_pids="$(pgrep -f "node.*myScheduling/frontend" || true)"
  if [[ -n "$node_pids" ]]; then
    echo "Stopping frontend node processes: $node_pids"
    echo "$node_pids" | xargs -r kill 2>/dev/null || true
  fi
}

stop_all() {
  echo "=== Stopping all servers ==="
  stop_api
  stop_frontend
  sleep 1
  echo "All servers stopped."
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
  stop_all
  build_backend
  build_frontend
  start_api
  tail_logs
}

# Parse command line arguments
case "${1:-}" in
  --stop|-s)
    stop_all
    ;;
  --help|-h)
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --stop, -s    Stop all backend and frontend servers"
    echo "  --help, -h    Show this help message"
    echo ""
    echo "Without options: Stops servers, rebuilds, and restarts backend"
    ;;
  *)
    main "$@"
    ;;
esac
