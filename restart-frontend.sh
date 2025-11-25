#!/usr/bin/env bash
# Restart helper for MyScheduling frontend (Vite preview serving built assets)
# Usage: ./restart-frontend.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONT_DIR="$ROOT_DIR/frontend"
LOG_FILE="/tmp/myscheduling-frontend.log"
PID_FILE="/tmp/myscheduling-frontend.pid"
PORT="${PORT:-4173}"
HOST="${HOST:-0.0.0.0}"

stop_frontend() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && ps -p "$pid" >/dev/null 2>&1; then
      echo "Stopping frontend (pid: $pid)..."
      kill "$pid" || true
      sleep 1
    fi
    rm -f "$PID_FILE"
  fi

  # Fallback: kill any lingering vite preview/dev
  local running
  running="$(pgrep -f "vite (preview|dev)" || true)"
  if [[ -n "$running" ]]; then
    echo "Stopping lingering Vite process(es): $running"
    echo "$running" | xargs -r kill
  fi
}

build_frontend() {
  echo "Building frontend..."
  (cd "$FRONT_DIR" && npm run build)
}

start_frontend() {
  echo "Starting frontend preview on http://$HOST:$PORT ..."
  (
    cd "$FRONT_DIR" || exit 1
    nohup npm run preview -- --host "$HOST" --port "$PORT" >"$LOG_FILE" 2>&1 &
    echo $! >"$PID_FILE"
  )
  local pid
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  echo "Frontend started (pid: ${pid:-unknown}). Logs: $LOG_FILE"
}

tail_logs() {
  echo "Last 20 log lines:"
  tail -n 20 "$LOG_FILE" || true
}

main() {
  stop_frontend
  build_frontend
  start_frontend
  tail_logs
}

main "$@"
