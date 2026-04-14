#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -x .bin/cloudflared ]]; then
  mkdir -p .bin
  wget -q -O .bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
  chmod +x .bin/cloudflared
fi

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

npm start > /tmp/service-mafia-server.log 2>&1 &
SERVER_PID=$!

for _ in {1..30}; do
  if curl -sS http://localhost:8080/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -sS http://localhost:8080/api/health >/dev/null 2>&1; then
  echo "Server failed to start. Check /tmp/service-mafia-server.log"
  exit 1
fi

echo "Server ready on http://localhost:8080"
echo "Starting Cloudflare tunnel..."

echo "When tunnel URL appears, open it on phone and install from browser menu/share sheet."
./.bin/cloudflared tunnel --url http://localhost:8080 --no-autoupdate
