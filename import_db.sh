#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
ENVFILE="$ROOT/backend/.env"
SAMPLES="$ROOT/my-app/database_sample"

: "${DB_HOST:=localhost}"
: "${DB_USER:=root}"
: "${DB_NAME:=clothing_data}"
: "${DB_PASSWORD:=}"

if [ -f "$ENVFILE" ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^(DB_HOST|DB_USER|DB_PASSWORD|DB_NAME)=' "$ENVFILE" | xargs)
fi

command -v mysql >/dev/null || { echo "mysql client not found on PATH"; exit 1; }
[ -n "${DB_PASSWORD:-}" ] && export MYSQL_PWD="$DB_PASSWORD"

mysql -h "$DB_HOST" -u "$DB_USER" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` DEFAULT CHARACTER SET utf8mb4;"
[ -d "$SAMPLES" ] || { echo "Sample folder not found: $SAMPLES"; exit 1; }

shopt -s nullglob
for f in "$SAMPLES"/*.sql; do
  echo "Importing $(basename "$f")..."
  mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < "$f"
done
unset MYSQL_PWD
echo "✅ Import complete."
