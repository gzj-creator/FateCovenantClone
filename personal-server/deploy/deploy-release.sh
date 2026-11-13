#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(git -C "$SCRIPT_DIR/../.." rev-parse --show-toplevel 2>/dev/null) || {
  printf 'deploy: run this script from a Git checkout of the project\n' >&2
  exit 2
}

SERVICE_NAME=${SERVICE_NAME:-fate-covenant-realm-3.service}
REALM_ID=${REALM_ID:-3}
DATA_DIR=${DATA_DIR:-/data/disk1/game/data-realm-3-live-20261112}
RELEASES_DIR=${RELEASES_DIR:-/data/disk1/game/releases}
CURRENT_LINK=${CURRENT_LINK:-/data/disk1/game/current}
BACKUP_ROOT=${BACKUP_ROOT:-/data/disk1/game/backups}
CALENDAR_REL=${CALENDAR_REL:-config/activity-calendar-realm-3.json}
SKIP_TESTS=${SKIP_TESTS:-0}
HEALTH_TIMEOUT=${HEALTH_TIMEOUT:-60}

usage() {
  cat <<'EOF'
Usage: deploy-release.sh [--skip-tests] [--help]

Deploy the current clean Git commit of personal-server as an immutable release,
then atomically switch /data/disk1/game/current and restart the realm service.
The script stops the service, backs up the live data directory, and rolls back
both the release link and the data directory if the new process fails health checks.

Environment overrides:
  SERVICE_NAME   systemd unit (default: fate-covenant-realm-3.service)
  REALM_ID       expected active server id (default: 3)
  DATA_DIR       persistent data directory (default: data-realm-3-live-20261112)
  RELEASES_DIR   release root (default: /data/disk1/game/releases)
  CURRENT_LINK   current symlink (default: /data/disk1/game/current)
  BACKUP_ROOT    backup root (default: /data/disk1/game/backups)
  CALENDAR_REL   activity calendar path under personal-server (default: realm 3)
  SKIP_TESTS     1 to skip npm test and deployment test
  HEALTH_TIMEOUT seconds to wait for readiness (default: 60)
EOF
}

log() { printf '[deploy] %s\n' "$*" >&2; }
fail() { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }

while (($#)); do
  case "$1" in
    --skip-tests) SKIP_TESTS=1 ;;
    --help|-h) usage; exit 0 ;;
    *) fail "unknown argument: $1" ;;
  esac
  shift
done

run_root() {
  if ((EUID == 0)); then
    "$@"
  else
    sudo -n "$@"
  fi
}

need_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

for command in git node npm rsync tar curl ss sha256sum systemctl; do
  need_command "$command"
done

[[ -d "$REPO_ROOT/personal-server" ]] || fail "personal-server not found under $REPO_ROOT"
[[ -d "$DATA_DIR" ]] || fail "data directory not found: $DATA_DIR"
[[ "$DATA_DIR" != "$REPO_ROOT"/* ]] || fail "DATA_DIR must be outside the repository"
[[ -f "$REPO_ROOT/personal-server/$CALENDAR_REL" ]] || fail "activity calendar not found: $CALENDAR_REL"
systemctl cat "$SERVICE_NAME" >/dev/null 2>&1 || fail "systemd unit not found: $SERVICE_NAME"

if [[ -n "$(git -C "$REPO_ROOT" status --porcelain --untracked-files=no)" ]]; then
  fail "tracked files have uncommitted changes; commit or restore them before deploying"
fi

log "fetching origin/main"
git -C "$REPO_ROOT" fetch --quiet origin main
HEAD_COMMIT=$(git -C "$REPO_ROOT" rev-parse HEAD)
REMOTE_COMMIT=$(git -C "$REPO_ROOT" rev-parse origin/main)
[[ "$HEAD_COMMIT" == "$REMOTE_COMMIT" ]] || fail "HEAD $HEAD_COMMIT is not origin/main $REMOTE_COMMIT; run git pull --ff-only first"

EXPECTED_PROFILE=$(node -e '
  const fs = require("node:fs");
  const config = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const server = (config.servers || []).find(item => item.id === Number(process.argv[2]));
  if (!server || !server.launchProfileId) process.exit(3);
  process.stdout.write(server.launchProfileId);
' "$REPO_ROOT/personal-server/config/public-server.json" "$REALM_ID") || fail "active server $REALM_ID has no launch profile"

if [[ "$SKIP_TESTS" != 1 ]]; then
  log "running fast test suite"
  (cd "$REPO_ROOT/personal-server" && npm test)
  log "running self-contained deployment test"
  (cd "$REPO_ROOT/personal-server" && npm run test:deployment)
else
  log "tests skipped by request"
fi

AUDIT_LOG=$(mktemp)
trap 'rm -f "$AUDIT_LOG"' EXIT
log "auditing activity schedule for $CALENDAR_REL"
if ! (cd "$REPO_ROOT/personal-server" && FC_ACTIVITY_CALENDAR_CONFIG="$REPO_ROOT/personal-server/$CALENDAR_REL" npm run audit:activity-schedule) | tee "$AUDIT_LOG" >&2; then
  fail "activity schedule audit failed"
fi
grep -q '^Result: PASS$' "$AUDIT_LOG" || fail "activity schedule audit did not report PASS"
rm -f "$AUDIT_LOG"
trap - EXIT

TS=$(date -u +%Y%m%dT%H%M%SZ)
REL="$RELEASES_DIR/release-$TS"
BACKUP_DIR="$BACKUP_ROOT/pre-$TS"
[[ ! -e "$REL" ]] || fail "release directory already exists: $REL"
mkdir -p "$REL" "$BACKUP_DIR"

log "copying personal-server to $REL"
rsync -a --delete \
  --exclude node_modules \
  --exclude '*.sqlite*' \
  --exclude '*.local-only.*' \
  --exclude runtime.local-only.data \
  "$REPO_ROOT/personal-server/" "$REL"/

if find "$REL" -type f \( -name '*.sqlite*' -o -name '*.local-only.*' \) -print -quit | grep -q .; then
  fail "release contains runtime-only files"
fi

log "installing production dependencies"
(cd "$REL" && npm ci --omit=dev --no-audit --no-fund)
printf '%s\n' "$HEAD_COMMIT" > "$REL/RELEASE_COMMIT"
printf '%s\n' "$TS" > "$REL/RELEASED_AT"

PREVIOUS_TARGET=$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)
[[ -n "$PREVIOUS_TARGET" && -d "$PREVIOUS_TARGET" ]] || fail "current release link is missing: $CURRENT_LINK"
printf '%s\n' "$PREVIOUS_TARGET" > "$BACKUP_DIR/previous-current.txt"

SERVICE_STOPPED=0
DEPLOYMENT_OK=0

rollback() {
  trap - ERR EXIT
  set +e
  log "rolling back to $PREVIOUS_TARGET"
  run_root systemctl stop "$SERVICE_NAME"
  if [[ -f "$BACKUP_DIR/data.tar.gz" && -d "$DATA_DIR" ]]; then
    FAILED_DATA="$BACKUP_DIR/failed-data-$TS"
    mv "$DATA_DIR" "$FAILED_DATA"
    tar -xzf "$BACKUP_DIR/data.tar.gz" -C "$(dirname "$DATA_DIR")"
  fi
  ln -sfn "$PREVIOUS_TARGET" "$CURRENT_LINK.next"
  mv -Tf "$CURRENT_LINK.next" "$CURRENT_LINK"
  run_root systemctl start "$SERVICE_NAME"
  sleep 3
  if systemctl is-active --quiet "$SERVICE_NAME"; then
    log "rollback service is active"
  else
    log "rollback service did not become active; inspect journalctl -u $SERVICE_NAME"
  fi
  exit 1
}

on_error() {
  local code=$?
  if ((code != 0 && SERVICE_STOPPED == 1 && DEPLOYMENT_OK == 0)); then
    rollback
  fi
  exit "$code"
}
trap on_error ERR EXIT

log "stopping $SERVICE_NAME"
run_root systemctl stop "$SERVICE_NAME"
SERVICE_STOPPED=1
for _ in $(seq 1 40); do
  systemctl is-active --quiet "$SERVICE_NAME" || break
  sleep 0.25
done
systemctl is-active --quiet "$SERVICE_NAME" && fail "service did not stop"

log "backing up $DATA_DIR to $BACKUP_DIR/data.tar.gz"
tar -czf "$BACKUP_DIR/data.tar.gz" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")"
sha256sum "$BACKUP_DIR/data.tar.gz" > "$BACKUP_DIR/data.tar.gz.sha256"

log "switching current to $REL"
ln -sfn "$REL" "$CURRENT_LINK.next"
mv -Tf "$CURRENT_LINK.next" "$CURRENT_LINK"
[[ "$(readlink -f "$CURRENT_LINK")" == "$REL" ]] || fail "current symlink did not switch"

log "starting $SERVICE_NAME"
run_root systemctl start "$SERVICE_NAME"

PID=""
for _ in $(seq 1 "$HEALTH_TIMEOUT"); do
  PID=$(systemctl show -p MainPID --value "$SERVICE_NAME" 2>/dev/null || true)
  if [[ "$PID" =~ ^[0-9]+$ ]] && ((PID > 0)); then
    if REALM_ID="$REALM_ID" EXPECTED_PROFILE="$EXPECTED_PROFILE" PID="$PID" STATUS_FILE="$DATA_DIR/server.local-only.json" \
      node --input-type=module <<'NODE' >/dev/null 2>&1
import fs from 'node:fs';
import net from 'node:net';
const status = JSON.parse(fs.readFileSync(process.env.STATUS_FILE, 'utf8'));
if (String(status.pid) !== process.env.PID) throw new Error('pid mismatch');
if (status.activeServerId !== Number(process.env.REALM_ID)) throw new Error('realm mismatch');
if (status.launchProfileId !== process.env.EXPECTED_PROFILE) throw new Error('launch profile mismatch');
const ports = Object.entries(status.boundPorts || {});
if (ports.length !== 5) throw new Error('bound port count mismatch');
for (const [name, port] of ports) {
  await new Promise((resolve, reject) => {
    const socket = net.connect({ host: '127.0.0.1', port, timeout: 1500 }, () => { socket.end(); resolve(); });
    socket.on('error', reject);
    socket.on('timeout', () => { socket.destroy(); reject(new Error(`port timeout: ${name}`)); });
  });
}
NODE
    then
      break
    fi
  fi
  systemctl is-active --quiet "$SERVICE_NAME" || fail "service exited during startup"
  sleep 1
done

[[ -n "$PID" ]] || fail "service did not report a main pid"
SDK_PORT=$(node -p 'JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")).boundPorts.sdk' "$DATA_DIR/server.local-only.json") || fail "unable to read SDK port"
HEALTH_BODY=$(curl -fsS --max-time 5 "http://127.0.0.1:$SDK_PORT/fc-local-1088.html") || fail "SDK health endpoint failed"
case "$HEALTH_BODY" in
  *140.143.142.251*) ;;
  *) fail "SDK health endpoint returned unexpected body: $HEALTH_BODY" ;;
esac

DB_PATH="$DATA_DIR/game.local-only.sqlite"
[[ -f "$DB_PATH" ]] || fail "game database not found: $DB_PATH"
node --input-type=module -e '
  import { DatabaseSync } from "node:sqlite";
  const db = new DatabaseSync(process.argv[1], { readOnly: true });
  const result = db.prepare("PRAGMA integrity_check").get();
  db.close();
  if (Object.values(result)[0] !== "ok") {
    console.error(JSON.stringify(result));
    process.exit(1);
  }
' "$DB_PATH" || fail "SQLite integrity check failed"

DEPLOYMENT_OK=1
SERVICE_STOPPED=0
trap - ERR EXIT
log "deployment complete: $REL (commit $HEAD_COMMIT)"
log "data backup: $BACKUP_DIR/data.tar.gz"
log "active server: $REALM_ID, launch profile: $EXPECTED_PROFILE, pid: $PID"
